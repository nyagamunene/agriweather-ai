# Scaling Considerations — AgriWeather AI

This document outlines the architectural decisions and scaling strategies relevant to a production deployment of AgriWeather AI, with specific attention to the challenges outlined by the WeatherAI platform (rate limits, quota management, and data reliability).

---

## 1. API Rate Limit Management

**Current state:** The Free tier allows 1,000 requests/month (200 AI). Exceeding this returns a `429` with `X-RateLimit-Reset`.

**Production strategy:**

- **In-memory + Redis caching** — cache weather responses keyed by `lat:lon:days:units` with a 10-minute TTL. This alone reduces API calls by ~90% for popular locations.
- **Stale-while-revalidate** — serve cached data immediately while refreshing in the background, so quota is never burned by concurrent requests for the same location.
- **Rate limit headers** — parse `X-RateLimit-Remaining` on every response; if below a threshold (e.g., 50), switch to a longer cache TTL and notify ops.
- **Request deduplication** — deduplicate in-flight requests for the same cache key using a promise map, preventing thundering-herd on cache miss.

```typescript
// Conceptual deduplication pattern
const inflight = new Map<string, Promise<WeatherResponse>>();

async function dedupedFetch(key: string, fetcher: () => Promise<WeatherResponse>) {
  if (inflight.has(key)) return inflight.get(key)!;
  const p = fetcher().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
```

---

## 2. Caching Architecture

**Layer 1 — Edge (Vercel CDN / Cloudflare)**
- API routes set `Cache-Control: public, s-maxage=600, stale-while-revalidate=1200`
- Vercel edge caches responses geographically close to users
- Zero backend hits for cached locations

**Layer 2 — Redis (Upstash)**
- Cross-instance shared cache for server-side requests
- Key: `weather:{lat}:{lon}:{days}:{units}`
- TTL: 600s (10 min) for current; 3600s (1 hr) for forecasts
- Atomic `SET NX` prevents cache stampede

**Layer 3 — In-process LRU**
- 100-item LRU cache per server instance for hot locations
- Sub-millisecond reads, no network round-trip

---

## 3. Background Processing & Scheduled Jobs

For a production agricultural platform, some workloads should be async:

- **Daily digest generation** — cron job (BullMQ + Redis) generates pre-computed forecasts for all registered farm locations nightly at 05:00 local time.
- **Alert triggers** — a queue worker polls the WeatherAI webhook or re-fetches forecasts and evaluates alert conditions (frost warning, heavy rain) for registered farmers.
- **Cache warm-up** — after each deploy, a lightweight job pre-fetches weather for the top 100 searched locations to warm the cache before real traffic arrives.

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Next.js    │───▶│  BullMQ      │───▶│  WeatherAI   │
│  API Route  │    │  Job Queue   │    │  API         │
└─────────────┘    └──────────────┘    └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Redis Cache │
                   └──────────────┘
```

---

## 4. Horizontal Scaling

- **Stateless API layer** — all state in Redis; any Next.js pod can serve any request.
- **Edge functions** — geocoding and weather proxy routes can run on Vercel Edge Runtime (no cold-start; globally distributed).
- **CDN-first design** — static assets and pre-rendered pages served from CDN without hitting any origin server.
- **Auto-scaling** — Vercel serverless scales to zero and handles spikes automatically; for dedicated infra, use Kubernetes HPA keyed on CPU and request queue depth.

---

## 5. Reliability & Resilience

**Retry logic (implemented in `WeatherClient`):**
- 3 attempts with exponential backoff (500ms, 1000ms, 2000ms)
- 429 is not retried (quota exceeded); 5xx and network errors are

**Circuit breaker:**
- After 5 consecutive failures, open the circuit for 30 seconds
- During open state, return cached data or a graceful degradation response
- Half-open probe re-attempts a single request before closing

**Graceful degradation:**
- If WeatherAI is unreachable, the UI shows the last cached data with a staleness indicator
- AI summaries are optional (`?ai=false` fallback) — core weather data always returns

---

## 6. Observability

**Structured logging (Pino / Winston):**
```json
{
  "level": "info",
  "event": "weather_api_call",
  "lat": -1.2921,
  "lon": 36.8219,
  "cache_hit": false,
  "duration_ms": 342,
  "ratelimit_remaining": 487
}
```

**Key metrics to track:**
- `weather_api_calls_total` — by cache_hit/miss
- `weather_api_latency_p99` — alert if > 2s
- `ratelimit_remaining` — alert if < 100
- `recommendation_generation_ms` — AI pipeline latency

**Tracing:** OpenTelemetry spans across API route → cache layer → WeatherAI call → response.

---

## 9. Multitenancy

AgriWeather AI is designed to evolve from a single-user weather dashboard into a multitenant platform serving cooperatives, agribusinesses, and extension officers managing multiple farms.

### Tenant Model

| Dimension | Single-tenant (today) | Multitenant (planned) |
|---|---|---|
| Data isolation | No auth; one global data pool | Row-Level Security (RLS) + `tenant_id` foreign key on all tables |
| User identity | None | Clerk / NextAuth — email, OAuth, passkey |
| Rate limits | Shared WeatherAI quota | Per-tenant quota pools (Pro vs. Enterprise tiers) |
| Caching | Keyed by `{lat}:{lon}` | Keyed by `{tenant}:{lat}:{lon}:{days}` |
| Pricing | Free | Per-farm, per-cooperative, or per-API-call |

### Database Strategy

```
ALTER TABLE locations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE plots    ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tree_analyses ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Row-Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON locations
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

All queries pass through a middleware that sets `app.current_tenant_id` from the JWT/session, enforced at the PostgreSQL level (not application code). No `WHERE tenant_id = $1` scattered across queries — just `SET LOCAL app.current_tenant_id` once per request.

### Team & Roles

| Role | Permissions |
|---|---|
| Owner | Full CRUD, billing, invite members |
| Manager | Manage farms, view reports, edit plots |
| Viewer | Read-only dashboard and reports |
| Extension Officer | Multi-farm view across assigned tenants |

Invites use magic-link emails; user membership stored in `tenant_members(user_id, tenant_id, role)`.

### Cache & Background Job Partitioning

- Redis keys prefixed with `tenant:{id}:` — cache invalidation scoped per tenant.
- BullMQ queues namespaced per tenant (`alerts:{tenant_id}`) — one tenant's alert spike doesn't delay another's.
- Rate limit counters in Redis: `ratelimit:{tenant_id}:weather_ai:month`.
- Each tenant gets isolated quota. Overuse by one never degrades service for others.

### Multi-Farm Views

- Extension officers switch between farms via a dropdown selector (already prototyped as `SavedFarms`).
- Aggregate dashboards: "All farms in Kiambu at a glance" — cross-tenant analytics for county-level officers.
- Bulk operations: broadcast a weather alert or spray recommendation to all farms in a tenant.

---

## 10. Data Privacy & Security

- API key stored server-side only (never exposed to client)
- Location data is coordinates only; no PII collected
- Nominatim geocoding: rate-limit compliance via User-Agent header and 1 req/s cap
- All external requests use HTTPS; no mixed content

---

## 11. Cost Optimization

| Strategy | Estimated savings |
|---|---|
| 10-min response cache | ~85% API call reduction |
| `?ai=false` on re-fetches | Preserves 200 AI req/month |
| Edge caching popular locations | Eliminates origin hits entirely |
| Stale-while-revalidate | Zero-latency cache misses |

At 1,000 MAU with 5 weather lookups/day, naive implementation burns ~150,000 req/month (Scale tier). With caching, same traffic fits comfortably in the Pro tier (50,000 req/month).
