import type { WeatherResponse } from "@/types/weather";

const BASE_URL = "https://api.weather-ai.co";

interface FetchOptions {
  lat: number;
  lon: number;
  days?: number;
  ai?: boolean;
  units?: "metric" | "imperial";
  lang?: string;
}

class WeatherClient {
  private apiKey: string;
  private cache = new Map<string, { data: WeatherResponse; ts: number }>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private cacheKey(endpoint: string, opts: FetchOptions): string {
    return `${endpoint}:${opts.lat}:${opts.lon}:${opts.days ?? 7}:${opts.units ?? "metric"}`;
  }

  private async request<T>(path: string, params: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          next: { revalidate: 600 },
        });

        if (res.status === 429) {
          const reset = res.headers.get("X-RateLimit-Reset");
          throw new Error(`Rate limit exceeded. Resets at ${reset ? new Date(Number(reset) * 1000).toISOString() : "unknown"}`);
        }

        if (!res.ok) {
          throw new Error(`Weather API error: ${res.status} ${res.statusText}`);
        }

        return res.json() as Promise<T>;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    throw lastError!;
  }

  async getForecast(opts: FetchOptions): Promise<WeatherResponse> {
    const key = this.cacheKey("/v1/weather", opts);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < this.TTL) return cached.data;

    const data = await this.request<WeatherResponse>("/v1/weather", {
      lat: opts.lat,
      lon: opts.lon,
      days: opts.days ?? 7,
      ai: opts.ai ?? true,
      units: opts.units ?? "metric",
      lang: opts.lang ?? "en",
    });

    this.cache.set(key, { data, ts: Date.now() });
    return data;
  }

  async getCurrentWeather(opts: Omit<FetchOptions, "days">): Promise<WeatherResponse> {
    return this.request<WeatherResponse>("/v1/current", {
      lat: opts.lat,
      lon: opts.lon,
      ai: opts.ai ?? false,
      units: opts.units ?? "metric",
    });
  }
}

let client: WeatherClient | null = null;

export function getWeatherClient(): WeatherClient {
  if (!client) {
    const key = process.env.WEATHER_AI_API_KEY;
    if (!key) throw new Error("WEATHER_AI_API_KEY is not set");
    client = new WeatherClient(key);
  }
  return client;
}
