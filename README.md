# AgriWeather AI

**Weather intelligence for smarter farming.**

AgriWeather AI is an agricultural weather intelligence platform that transforms real-time weather data into actionable farming insights. Built on the [WeatherAI API](https://weather-ai.co/docs), it delivers 7-day forecasts, crop-specific risk analysis, and AI-generated recommendations for farmers, agribusinesses, and agricultural cooperatives.

---

## Features

- **Live Weather Dashboard** — current conditions with temperature, humidity, wind, UV index, dew point, and pressure
- **7-Day Forecast Timeline** — visual day-by-day forecast with precipitation probability
- **Interactive Charts** — temperature trends, rainfall forecasts, and humidity/wind charts with hover interactions
- **Crop Intelligence** — supports 8 crops (maize, wheat, tea, coffee, tomatoes, potatoes, beans, sunflower) with ideal condition profiles
- **AI Risk Analysis** — computed drought, flood, heat stress, frost, and disease risk scores based on forecast data
- **Smart Recommendations** — prioritized irrigation, fertilizer, planting, and pest management advice tailored to selected crop
- **AI Weather Summary** — Gemini-powered natural language weather summaries from WeatherAI
- **Location Search** — geocoding via OpenStreetMap Nominatim with debounced autocomplete
- **Responsive Design** — dark premium SaaS aesthetic, works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Weather Data | WeatherAI API (`/v1/weather`, `/v1/current`) |
| Geocoding | OpenStreetMap Nominatim |
| Deployment | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── weather/         # Proxies WeatherAI API (caching + auth)
│   │   ├── geocode/         # Location search via Nominatim
│   │   └── recommendations/ # Generates crop-specific advice
│   ├── dashboard/           # Main application page
│   └── layout.tsx
├── features/
│   ├── weather/             # WeatherCharts, CurrentWeatherCard, ForecastTimeline
│   ├── crops/               # CropSelector, data, risk-calculator
│   └── ai/                  # RecommendationsPanel, RiskAnalysis
├── lib/
│   ├── api/                 # WeatherClient (typed, cached, retry logic)
│   └── utils/               # cn(), weather helpers
├── hooks/
│   └── useWeather.ts        # Data fetching + state management
└── types/                   # WeatherResponse, CropProfile, etc.
```

### API Client Design

`WeatherClient` is a typed singleton with:
- In-memory cache (10-min TTL, keyed by `lat:lon:days:units`)
- Exponential backoff retry (3 attempts, 500ms base)
- `X-RateLimit-*` header awareness
- `?ai=false` fallback to preserve AI quota

All external API calls go through `/api/*` server routes — the WeatherAI key never reaches the browser.

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- A WeatherAI API key ([get one at weather-ai.co](https://weather-ai.co/docs))

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/agriweather-ai.git
cd agriweather-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — add your WeatherAI API key:
# WEATHER_AI_API_KEY=wai_your_key_here

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WEATHER_AI_API_KEY` | Yes | WeatherAI API key (prefix: `wai_`) |

---

## API Design

### `GET /api/weather`
Proxies WeatherAI `/v1/weather`. Adds server-side caching and auth.

| Param | Type | Description |
|---|---|---|
| `lat` | float | Latitude |
| `lon` | float | Longitude |
| `days` | int | Forecast days (1–7 on Free) |

### `GET /api/geocode`
Location autocomplete via Nominatim.

| Param | Type | Description |
|---|---|---|
| `q` | string | Search query (min 2 chars) |

### `POST /api/recommendations`
Generates crop-specific farming recommendations server-side from weather + crop profile data.

---

## Scaling Considerations

See [SCALING.md](./SCALING.md) for a detailed discussion of:

- API rate limit management and caching strategy
- Redis + edge caching architecture
- Background job processing (BullMQ)
- Horizontal scaling and stateless design
- Circuit breaker and graceful degradation
- Observability and structured logging

---

## Future Improvements

- **Authentication** — user accounts to save farm locations and crop profiles
- **WhatsApp/SMS Alerts** — integrate WeatherAI SMS API (Scale tier) for farmer notifications
- **Farming Calendar** — planting and harvesting schedule based on forecast trends
- **Historical Analytics** — seasonal trend comparison and anomaly detection
- **PDF Reports** — downloadable weekly weather intelligence reports
- **Multi-language** — Swahili support using WeatherAI's `lang=sw` parameter
- **Tree Analysis** — integrate WeatherAI `/v1/trees/analyze` for agroforestry insights

---

## License

MIT
