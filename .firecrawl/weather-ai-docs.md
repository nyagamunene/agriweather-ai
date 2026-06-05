BASE URLhttps://api.weather-ai.co

API Key

Developer Reference

# WeatherAI API  Documentation

Real-time and forecast weather data with AI-generated summaries, SMS/USSD delivery, webhook subscriptions, and usage analytics — all behind a single REST API.

Free — 1K req/mo

Pro — 50K req/mo

Scale — 500K req/mo + SMS

Setup

## Authentication

Every request must include your API key as a Bearer token. Keys are prefixed `wai_` and scoped to your plan.

ℹGenerate keys from **Dashboard → API Keys**. Keys are SHA-256 hashed before storage — the plaintext is only shown once on creation.

HTTP HeaderCopy

```
Authorization: Bearer wai_<your_api_key>
```

cURLCopy

```
curl https://api.weather-ai.co/v1/weather?lat=-1.2921&lon=36.8219 \
  -H "Authorization: Bearer wai_your_key_here"
```

JavaScriptCopy

```
const res = await fetch(
  'https://api.weather-ai.co/v1/weather?lat=-1.2921&lon=36.8219',
  { headers: { Authorization: 'Bearer wai_your_key_here' } }
);
const data = await res.json();
```

Billing

## Plans & Rate Limits

Limits reset on a 30-day rolling period from subscription date, not calendar month.

| Plan | Requests/mo | AI Requests/mo | Forecast days | Webhooks | SMS/USSD | Team seats |
| --- | --- | --- | --- | --- | --- | --- |
| Free | 1,000 | 200 | 7 | ✕ | ✕ | 1 |
| Pro | 50,000 | 10,000 | 14 | ✓ up to 10 | ✕ | 5 |
| Scale | 500,000 | 100,000 | 16 | ✓ up to 50 | ✓ approval req. | 20 |

⚠Add `?ai=false` to skip Gemini AI summaries and preserve your AI quota.

Rate Limit Headers

```
X-RateLimit-Limit:     50000      # monthly cap
X-RateLimit-Remaining: 49987      # requests remaining
X-RateLimit-Reset:     1717977600 # unix epoch reset time
```

Reference

## Error Codes

| Status | Meaning | Common cause |
| --- | --- | --- |
| 401 | Unauthorized | Missing, malformed, or revoked API key |
| 403 | Forbidden | Plan doesn't include this feature; SMS not yet enabled |
| 429 | Too Many Requests | Monthly quota exceeded — check `X-RateLimit-Reset` |
| 400 | Bad Request | Missing required parameters |
| 500 | Internal Error | Server-side issue — retry with exponential backoff |
| 503 | Service Unavailable | Database unreachable — fail-closed for SMS gates |

Weather Endpoints

## Weather API

Fetch current conditions and multi-day forecasts by coordinates. Gemini AI summaries included by default.

GET/v1/weatherALL PLANSCurrent conditions + forecast

Query Parameters

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| days | integer | optional | Forecast days (1–7 Free, 1–14 Pro, 1–16 Scale). Default: 7 |
| ai | boolean | optional | Include AI summary. Default: true |
| units | string | optional | `metric` (°C) or `imperial` (°F). Default: metric |
| lang | string | optional | Language code for AI summary e.g. `en`, `sw`. Default: en |

⚡ TRY ITkey from top bar

lat

lon

days

aitruefalse

unitsmetricimperial

▶ Send Request

Copy

GET/v1/forecastALL PLANSAlias of /v1/weather

ℹConvenience alias for `/v1/weather`. Accepts identical parameters, returns the same shape.

⚡ TRY IT

lat

lon

days

aifalsetrue

▶ Send Request

Copy

GET/v1/currentALL PLANSCurrent conditions only

ℹReturns present-moment weather conditions. Delegates to the same handler as `/v1/weather` — accepts identical parameters.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| ai | boolean | optional | Include AI summary. Default: true |
| units | string | optional | `metric` or `imperial`. Default: metric |
| lang | string | optional | Language code for AI summary. Default: en |

GET/v1/dailyALL PLANSDaily forecast breakdown

ℹDay-by-day forecast. Delegates to the same handler as `/v1/weather` — accepts identical parameters.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| days | integer | optional | Forecast days (1–7 Free, 1–14 Pro, 1–16 Scale). Default: 7 |
| ai | boolean | optional | Include AI summary. Default: true |
| units | string | optional | `metric` or `imperial`. Default: metric |

GET/v1/hourlyALL PLANSHourly forecast breakdown

ℹHour-by-hour forecast data. Delegates to the same handler as `/v1/weather` — accepts identical parameters.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| days | integer | optional | Forecast days (1–7 Free, 1–14 Pro, 1–16 Scale). Default: 7 |
| ai | boolean | optional | Include AI summary. Default: true |
| units | string | optional | `metric` or `imperial`. Default: metric |

GET/v1/forecast14PRO+14-day extended forecast

⚠Requires **Pro or Scale** plan. Free-plan keys receive a `403`.

Extended 14-day forecast endpoint. Accepts identical parameters to `/v1/weather`; the `days` parameter is capped at 14 for Pro and 16 for Scale.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| days | integer | optional | Forecast days up to 14 (Pro) or 16 (Scale). Default: 14 |
| ai | boolean | optional | Include AI summary. Default: true |
| units | string | optional | `metric` or `imperial`. Default: metric |
| lang | string | optional | Language code for AI summary. Default: en |

GET/v1/insightsPRO+AI-powered weather insights

⚠Requires **Pro or Scale** plan. Free-plan keys receive a `403`.

Returns weather data with enhanced Gemini AI analysis — agronomic context, risk flags, and actionable recommendations alongside standard forecast fields. Delegates to the same handler as `/v1/weather`; AI is always enabled.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| lat | float | required | Latitude e.g. -1.2921 |
| lon | float | required | Longitude e.g. 36.8219 |
| days | integer | optional | Forecast days (plan-limited). Default: 7 |
| units | string | optional | `metric` or `imperial`. Default: metric |
| lang | string | optional | Language code for AI summary. Default: en |

GET/v1/weather-geoALL PLANSWeather + IP geo-detection

Auto-detects caller location from IP when `?ip=auto`. Returns weather + geo metadata in response headers.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| ip | string | optional | Pass `auto` to detect from request IP, or an explicit IP |
| lat | float | optional | Override detected latitude |
| lon | float | optional | Override detected longitude |
| days | integer | optional | Forecast days (plan-limited) |
| ai | boolean | optional | Include AI summary. Default: true |

Response Headers

```
X-Country: KE
X-Region:  Nairobi County
X-City:    Nairobi
```

⚡ TRY IT

ip

days

aifalsetrue

▶ Send Request

Copy

GET/v1/ip-lookupPRO+Resolve IP address to geo coordinates

Resolves an IP address to latitude, longitude, city, region, country, and timezone. Pass `?ip=auto` (default) to detect from the request IP, or supply any explicit IPv4/IPv6 address.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| ip | string | optional | IP to resolve. Pass `auto` (default) to detect from request, or an explicit IPv4/IPv6 address |

Response

```
{
  "ip":       "41.90.64.1",
  "ip_hash":  "a3f1...",
  "ip_version": "v4",
  "geo": {
    "lat":      -1.2921,
    "lon":      36.8219,
    "city":     "Nairobi",
    "region":   "Nairobi County",
    "country":  "KE",
    "timezone": "Africa/Nairobi"
  }
}
```

⚡ TRY IT

ip

▶ Send Request

Copy

Account

## Usage & Quota

GET/v1/usageALL PLANSBilling period usage stats

Returns request counts, AI request counts, plan limits, and billing period start/end. No query parameters.

⚡ TRY IT

▶ Send Request

Copy

Webhooks

## Webhooks PRO+

Subscribe to weather trigger events. WeatherAI POSTs to your URL when conditions are met.

POST/v1/webhooksPRO+Create a webhook subscription

Request Body (JSON)

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| url | string | required | HTTPS endpoint to receive POST payloads |
| lat | float | required | Latitude of location to monitor |
| lon | float | required | Longitude of location to monitor |
| triggers | string\[\] | required | e.g. `["rain","extreme_wind","frost"]` |
| timezone | string | optional | IANA timezone. Default: UTC |

ExampleCopy

```
POST /v1/webhooks
Authorization: Bearer wai_your_key
Content-Type: application/json

{
  "url":      "https://yourapp.com/weather-hook",
  "lat":      -1.2921,
  "lon":      36.8219,
  "triggers": ["rain", "extreme_wind"],
  "timezone": "Africa/Nairobi"
}
```

✓Pro supports up to **10** webhooks. Scale supports up to **50**.

GET/v1/webhooksPRO+List your webhooks

Returns all active webhook subscriptions for your account.

Response

```
{
  "webhooks": [\
    {\
      "id":        "abc123",\
      "url":       "https://yourapp.com/hook",\
      "lat":       -1.2921,\
      "lon":       36.8219,\
      "triggers":  ["rain"],\
      "timezone":  "Africa/Nairobi",\
      "active":    true,\
      "createdAt": "2024-11-01T10:00:00Z"\
    }\
  ]
}
```

DEL/v1/webhooks/:idPRO+Delete a webhook

Permanently deletes a webhook. Returns `404` if not found or owned by another account.

cURLCopy

```
curl -X DELETE https://api.weather-ai.co/v1/webhooks/abc123 \
  -H "Authorization: Bearer wai_your_key"
```

SMS / USSD

## SMS API SCALE ONLY

Programmatic SMS delivery and farmer registration. Requires Scale plan + admin compliance approval.

⚠SMS routes require (1) Scale plan and (2) **smsEnabled = true** on your account — set by admin after compliance review. Submit documents via Billing panel → Request SMS Access. Until approved, calls return `403 SMS_NOT_ENABLED`.

POST/v1/sms/sendSCALESend an SMS message

Request Body (JSON)

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| to | string | required | Recipient phone in E.164 format e.g. `+254712345678` |
| message | string | required | SMS body text (max 160 chars per segment) |
| type | string | optional | Type tag for analytics. Default: `general` |
| pilotTag | string | optional | Pilot programme identifier for grouping in SMS stats |

ExampleCopy

```
POST /v1/sms/send
Authorization: Bearer wai_your_key

{
  "to":      "+254712345678",
  "message": "Heavy rain expected tomorrow. Plan ahead.",
  "type":    "weather_alert"
}
```

POST/v1/sms/alertSCALESend a structured alert

Sends a formatted weather alert using a predefined template keyed by `alertType`.

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| to | string | required | Recipient phone in E.164 |
| alertType | string | required | `rain` · `frost` · `extreme_wind` · `drought` |
| data | object | optional | Context merged into template e.g. `{"mm":45,"day":"tomorrow"}` |

POST/v1/sms/bomet/registerSCALERegister a Bomet farmer

Registers a farmer in the Bomet Agricultural Alert System. Creates a profile and schedules daily weather SMS alerts.

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| phone | string | required | Farmer's phone (E.164) |
| name | string | required | Full name |
| location | string | optional | Village/ward e.g. `Bomet Central` |
| cropType | string | optional | Primary crop e.g. `maize` · `tea` |

GET/v1/sms/statsSCALESMS usage statistics

Returns delivery stats, message counts by type, gateway usage, and opt-out rates. No parameters.

GET/v1/sms/healthSCALESMS gateway health check

Connectivity status for the SMS gateway and Africa's Talking fallback.

Example Response

```
{
  "gateway":   "ok",
  "fallback":  "ok",
  "lastCheck": "2025-05-20T07:58:00Z",
  "latencyMs": 142
}
```

Agroforestry

## Trees & Forestry API

Upload drone, aerial, or satellite images to automatically count tree crowns, assess canopy health, and get agronomic recommendations — powered by OpenCV computer vision and Gemini AI.

| Plan | Analyses / month | CV engine | Overlay image | Gemini context |
| --- | --- | --- | --- | --- |
| Free | 5 | ✓ | ✓ | ✓ |
| Pro | 100 | ✓ | ✓ | ✓ |
| Scale | Unlimited | ✓ | ✓ | ✓ |

POST/v1/trees/analyzeALL PLANSCount trees + assess canopy health from image

Upload a farm image (drone, aerial, satellite) as `multipart/form-data`. Returns tree count, density, health breakdown, an annotated overlay image, and Gemini-powered agronomic observations.

Form Fields

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| image | file | required | JPEG, PNG, or WEBP — max 20 MB |
| farmerId | string | optional | Your farmer / plot identifier — echoed in response |
| county | string | optional | County or region — provides context for Gemini |
| landAcres | float | optional | Plot size in acres — enables `tree_density_per_acre` |
| location | string | optional | Human-readable farm name or GPS description |
| notes | string | optional | Extra context for Gemini e.g. "Tea plantation, recently pruned" |

cURL ExampleCopy

```
curl -X POST https://api.weather-ai.co/v1/trees/analyze \
  -H "Authorization: Bearer wai_your_key" \
  -F "image=@/path/to/farm.jpg" \
  -F "farmerId=F-001" \
  -F "county=Bomet" \
  -F "landAcres=2.5" \
  -F "notes=Tea plantation"
```

Response 200

```
{
  "analysis_id":           "Kx8mP2qRvTnZ",
  "timestamp":             "2026-06-01T09:15:00.000Z",
  "farmer_id":             "F-001",
  "county":                "Bomet",
  "location":              "Kapkimolwa Farm, Block C",
  "land_acres":            2.5,
  "total_tree_count":      84,
  "tree_density_per_acre": 33.6,
  "confidence_score":      0.87,
  "canopy_coverage_pct":   41.2,
  "tree_health": {
    "healthy":             68,
    "needs_care":          12,
    "needs_replacement":    4
  },
  "low_confidence":        false,
  "tree_species_guess":    "Tea (Camellia sinensis)",
  "observations": [\
    "Dense canopy in northern quadrant — possible over-crowding",\
    "3 trees near water source show yellowing — likely waterlogging"\
  ],
  "recommendations": [\
    "Consider thinning northern section to improve light penetration",\
    "Improve drainage around water source trees"\
  ],
  "original_image_url":    "https://storage.googleapis.com/…/original.jpg",
  "overlay_image_url":     "https://storage.googleapis.com/…/overlay.jpg",
  "cv_debug": {
    "orig_resolution": "4000x3000",
    "work_resolution": "1500x1125",
    "canopy_px":       412500,
    "peaks_detected":  91,
    "after_area_filter": 84
  }
}
```

⚡ TRY IT — Image Uploadmultipart/form-data

Drop a farm image here or click to browse

JPEG · PNG · WEBP · max 20 MB

✕ Remove image

farmerId

county

landAcres

location

notes

▶ Analyze Image

Uploading image…

Copy JSON

Original

Annotated Overlay

Observations & Recommendations

GET/v1/trees/historyALL PLANSList past analyses for your account

Returns a paginated list of past tree analyses for the authenticated caller, ordered newest first.

| Param | Type | Req | Description |
| --- | --- | --- | --- |
| limit | integer | optional | Results per page (default 20, max 100) |
| cursor | string | optional | Pagination cursor from previous response `next_cursor` |

⚡ TRY IT

limit

cursor

▶ Send Request

Copy

GET/v1/trees/quotaALL PLANSRemaining tree analysis quota this month

Returns how many tree analyses you have used and remaining for the current calendar month.

Response

```
{
  "plan":      "pro",
  "used":      12,
  "limit":     100,
  "remaining": 88,
  "unlimited": false,
  "resets_at": "2026-07-01T00:00:00.000Z"
}
```

⚡ TRY IT

▶ Send Request

Copy

POST/v1/forestry/count-treesALL PLANSLegacy alias — identical to /v1/trees/analyze

ℹConvenience alias for `/v1/trees/analyze`. Accepts the same multipart fields and returns the identical response shape. Useful if you have existing integrations pointing to `/v1/forestry/count-trees`.

cURLCopy

```
curl -X POST https://api.weather-ai.co/v1/forestry/count-trees \
  -H "Authorization: Bearer wai_your_key" \
  -F "image=@/path/to/farm.jpg" \
  -F "farmerId=F-001" \
  -F "county=Bomet" \
  -F "landAcres=2.5"
```

Firebase Callable Functions

## Billing Functions

These are Firebase HTTPS callable functions invoked via the Firebase SDK — not plain REST. They require an authenticated Firebase user session.

ℹCall these via the Firebase JS SDK: `httpsCallable(functions, 'functionName')(payload)`. They enforce Firebase Auth internally — no API key needed, but the user must be signed in.

FNcancelSubscriptionPRO / SCALECancel active subscription

Cancels the caller's Paystack subscription at period end (non-immediate). Verifies subscription ownership with Paystack before disabling. Takes no payload.

Response

| Field | Type | Description |
| --- | --- | --- |
| success | boolean | Always `true` on success |
| message | string | Human-readable confirmation |
| periodEnd | string \| null | ISO date when access expires |

Firebase SDKCopy

```
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const cancel = httpsCallable(functions, 'cancelSubscription');

const result = await cancel();
// result.data = { success: true, message: "...", periodEnd: "2025-06-15" }
```

Error codes

| Code | Cause |
| --- | --- |
| unauthenticated | User not signed in |
| failed-precondition | No active subscription (already free) |
| permission-denied | Subscription doesn't match authenticated user's email |
| internal | Paystack API error — retry |

FNrequestSmsAccessSCALESubmit SMS compliance request

Submits an SMS/USSD access request for admin compliance review. Requires Scale plan. Stores the request in `sms_access_requests` and notifies the ops team. One pending request per user.

Payload Fields

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| businessName | string | required | Legal/trading name of the business |
| contactName | string | required | Contact person full name |
| contactEmail | string | required | Contact email address |
| contactPhone | string | optional | Kenyan phone number for follow-up |
| useCase | string | required | Description of SMS/USSD usage |
| estimatedVolume | string | optional | Estimated monthly SMS volume |
| docBusinessReg | string | required | Firebase Storage URL — business registration certificate |
| docKraPinCert | string | required | Firebase Storage URL — KRA PIN certificate |
| docDirectorId | string | required | Firebase Storage URL — director's national ID/passport |
| optInFlowDescription | string | required | Written description of end-user opt-in mechanism |

Response statuses

| Status | Meaning |
| --- | --- |
| submitted | Request created, team notified via email |
| already\_pending | Existing pending request found — deduplicated |
| already\_enabled | SMS is already active on the account |

⚠Upload documents to Firebase Storage _before_ calling this function. Pass the download URLs in the `doc*` fields. Admin manually sets `users/{uid}.smsEnabled = true` after review.

FNcontactSalesALL PLANSSend a sales / enterprise enquiry

Sends a sales/enterprise enquiry to `support@weather-ai.co` via Resend and stores the lead in `sales_leads`. Unauthenticated calls are permitted (pricing page use case).

Payload Fields

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| name | string | required | Contact person name |
| email | string | required | Contact email |
| company | string | optional | Company name |
| message | string | optional | Free-form message |
| type | string | optional | `sales` (pricing page) or `custom` (billing panel upgrade). Default: sales |
| currentPlan | string | optional | Caller's current plan. Default: free |

FNgetPaystackConfigALL PLANSFetch Paystack public config

Returns the Paystack public key and plan pricing for the frontend to initialize the Paystack widget. The secret key is **never** returned.

Response shape

Response

```
{
  "public_key": "pk_live_...",
  "plans": {
    "pro":   { "kes": 2500, "usd": 19, "name": "Pro" },
    "scale": { "kes": 9500, "usd": 79, "name": "Scale" }
  }
}
```