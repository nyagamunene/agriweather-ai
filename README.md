# AgriWeather AI

**Weather intelligence for smarter farming.**

AgriWeather AI is an agricultural weather intelligence platform that transforms real-time weather data into actionable farming insights. Built on the [WeatherAI API](https://weather-ai.co/docs), it delivers 7-day forecasts, crop-specific risk analysis, AI-generated recommendations, tree canopy analysis, and a full history of past sessions — all in a single field operations terminal.

---

## Features

- **Live Weather Dashboard** — current conditions with temperature, humidity, wind, UV index, feels-like, and wind gusts enriched from the nearest hourly data point
- **7-Day Forecast Timeline** — visual day-by-day forecast with precipitation probability and condition icons
- **Interactive Charts** — temperature trends, rainfall forecasts, and humidity/wind charts with hover interactions
- **Hourly Forecast** — hour-by-hour breakdown for the current day
- **Crop Intelligence** — 40+ crops across categories (cereals, vegetables, cash crops, fruits, legumes) with ideal condition profiles, risk thresholds, and growing season data
- **AI Risk Analysis** — computed drought, flood, heat stress, frost, and disease risk scores based on forecast data
- **AI Recommendations** — DeepSeek-powered prioritized irrigation, fertilizer, planting, and pest management advice tailored to the selected crop and live weather
- **Tree & Canopy Analysis** — upload drone/aerial images for CV-based tree crown counting, canopy health scoring, and agronomic recommendations via WeatherAI `/v1/trees/analyze`
- **Map Picker** — interactive Leaflet map for clicking a location pin or drawing a polygon boundary to calculate plot acreage
- **Location Search** — geocoding via OpenStreetMap Nominatim with debounced autocomplete and reverse geocoding
- **History Panel** — persistent record of recent locations and tree analysis results, stored in PostgreSQL and browsable in-app
- **API Usage Widget** — live quota bar in the header showing remaining WeatherAI requests for the billing period
- **Report Generator** — downloadable farm weather intelligence reports
- **Theme Toggle** — light and dark mode
- **Responsive Design** — warm charcoal/amber editorial aesthetic, works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet + leaflet-draw |
| Weather Data | WeatherAI API (`/v1/weather`, `/v1/trees/analyze`, `/v1/usage`) |
| Geocoding | OpenStreetMap Nominatim |
| AI Recommendations | DeepSeek Chat (`deepseek-chat`, JSON mode) |
| Database | PostgreSQL via Neon (postgres.js client) |
| Deployment | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── weather/         # Proxies WeatherAI API with DB caching
│   │   ├── geocode/         # Location search + reverse geocoding via Nominatim
│   │   ├── recommendations/ # DeepSeek LLM crop advice (json_object mode)
│   │   ├── trees/           # WeatherAI tree canopy analysis proxy
│   │   ├── history/         # Recent locations + tree analyses from DB
│   │   └── usage/           # WeatherAI billing period quota stats
│   ├── dashboard/           # Main application page
│   └── layout.tsx
├── components/
│   ├── LocationSearch.tsx   # Debounced geocoding input with map button
│   ├── MapPicker.tsx        # Radix Dialog wrapper for Leaflet map
│   ├── MapContent.tsx       # Leaflet map: click-to-pin + polygon draw modes
│   ├── ThemeToggle.tsx      # Light/dark mode toggle
│   └── ThemeProvider.tsx
├── features/
│   ├── weather/             # CurrentWeatherCard, ForecastTimeline, HourlyForecast, WeatherCharts
│   ├── crops/               # CropSelector, crop data (40+ crops), risk-calculator
│   ├── ai/                  # RecommendationsPanel, RiskAnalysis, ActionSummary
│   ├── trees/               # TreeAnalysis — image upload + results
│   ├── history/             # HistoryPanel — recent locations + tree history
│   └── reports/             # ReportGenerator
├── lib/
│   ├── db/                  # postgres.js singleton + query helpers
│   ├── pdf/                 # Report PDF generation
│   └── utils/               # cn(), weather helpers
├── hooks/
│   └── useWeather.ts        # Data fetching, hourly enrichment, recs state
└── types/                   # WeatherResponse, CropProfile, TreeAnalysisRow, etc.
```

### Key Design Decisions

- **All external API calls go through `/api/*` server routes** — WeatherAI and DeepSeek keys never reach the browser.
- **DB graceful degradation** — all postgres.js calls are wrapped in try/catch; the app works fully without `DATABASE_URL`.
- **Hourly enrichment** — `current.humidity`, `feels_like`, `uv_index`, and `wind_gust` are not returned by the WeatherAI `current` object; `useWeather` enriches them from the nearest hourly data point.
- **Leaflet SSR** — `MapContent` is dynamically imported with `{ ssr: false }` to avoid `window is not defined` during Next.js build.
- **DeepSeek JSON mode** — `response_format: { type: "json_object" }` eliminates markdown-wrapped JSON from the LLM, making `JSON.parse` reliable without regex stripping.

---

## Setup

### Prerequisites

- Node.js 20+
- A WeatherAI API key ([weather-ai.co](https://weather-ai.co/docs))
- A DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com/api_keys))
- PostgreSQL database (Neon free tier works — optional, app degrades gracefully without it)

### Local Development

```bash
git clone https://github.com/nyagamunene/agriweather-ai.git
cd agriweather-ai
```

**Option A — Docker (recommended, includes PostgreSQL + pgweb):**

```bash
# First-time setup: copies .env.local, starts containers, installs deps, runs migrations
make dev.setup

# Start the app with hot-reload
make dev.start
```

**Option B — Local Node.js only:**

```bash
cp .env.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WEATHER_AI_API_KEY` | Yes | WeatherAI API key (`wai_` prefix) |
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key (`sk-` prefix) — powers crop recommendations |
| `DATABASE_URL` | Optional | PostgreSQL connection string — enables history and weather cache |
| `POSTGRES_PASSWORD` | Docker only | Local Postgres container password |

### Database Migrations

If connecting your own PostgreSQL, run the migrations in order:

```bash
psql $DATABASE_URL -f db/migrations/20260605000001_create_extensions.sql
psql $DATABASE_URL -f db/migrations/20260605000002_create_locations.sql
psql $DATABASE_URL -f db/migrations/20260605000003_create_weather_cache.sql
psql $DATABASE_URL -f db/migrations/20260605000004_create_farmers_and_plots.sql
psql $DATABASE_URL -f db/migrations/20260605000005_create_tree_analyses.sql
psql $DATABASE_URL -f db/migrations/20260605000006_create_recommendation_logs.sql
psql $DATABASE_URL -f db/migrations/20260606000007_add_unique_constraints.sql
```

### Make Commands

| Command | Description |
|---|---|
| `make dev.setup` | First-time setup (env, containers, deps, migrations) |
| `make dev.start` | Start app with hot-reload |
| `make dev.stop` | Stop all containers |
| `make dev.logs` | Stream container logs |
| `make dev.console` | Shell into the app container |
| `make db.console` | Connect to PostgreSQL via psql |
| `make db.reset` | Drop and recreate the database |
| `make db.dump` | Dump schema to `db/structure.sql` |
| `make build` | Production build |
| `make lint` | Run ESLint |

---

## API Reference

### `GET /api/weather`
Proxies WeatherAI `/v1/weather`. Caches responses in PostgreSQL (10-min TTL) and adds retry logic.

| Param | Type | Description |
|---|---|---|
| `lat` | float | Latitude |
| `lon` | float | Longitude |
| `days` | int | Forecast days (1–7 on Free tier) |

### `GET /api/geocode`
Forward and reverse geocoding via Nominatim.

| Param | Type | Description |
| --- | --- | --- |
| `q` | string | Forward search query (min 2 chars) |
| `reverse` | `1` | Enable reverse geocoding mode |
| `lat` | float | Latitude (reverse mode) |
| `lon` | float | Longitude (reverse mode) |

### `POST /api/recommendations`

Generates crop-specific farming recommendations via DeepSeek Chat. Requires `current`, `forecast`, and `crop` in the request body. Returns up to 5 recommendations with `category`, `priority`, `title`, `detail`, and `icon`.

### `POST /api/trees`

Proxies WeatherAI `/v1/trees/analyze`. Accepts `multipart/form-data` with `image`, optional `county`, and `landAcres`. Saves result to `tree_analyses` table.

### `GET /api/history`

Returns last 10 searched locations and last 10 tree analyses from PostgreSQL.

### `GET /api/usage`

Returns current billing period request counts, AI request counts, plan limits, and remaining quota from WeatherAI `/v1/usage`.

### `GET /api/health`

Returns `{ status: "ok" }`. Used by Docker healthcheck.

---

## Scaling Considerations

See [SCALING.md](./SCALING.md) for a detailed discussion of:

- API rate limit management and caching strategy
- Redis + edge caching architecture
- Background job processing (BullMQ)
- Horizontal scaling and stateless design
- Circuit breaker and graceful degradation
- Observability and structured logging
- Multitenancy — tenant isolation, RLS, team roles, and multi-farm views

---

## License

MIT
