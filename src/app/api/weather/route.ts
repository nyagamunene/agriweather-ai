import { NextRequest, NextResponse } from "next/server";
import { saveLocation, saveWeatherCache } from "@/lib/db";

const BASE_URL = "https://api.weather-ai.co";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 7);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const apiKey = process.env.WEATHER_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/v1/weather?lat=${lat}&lon=${lon}&days=${days}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 600 },
      });

      if (res.status === 429) {
        const reset = res.headers.get("X-RateLimit-Reset");
        return NextResponse.json({ error: `Rate limit exceeded. Resets at ${reset}` }, { status: 429 });
      }
      if (!res.ok) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 500 * 2 ** attempt)); continue; }
        return NextResponse.json({ error: `WeatherAI API error: ${res.status}` }, { status: 502 });
      }

      const data = await res.json();

      // Persist location and weather cache (non-blocking, silent failures)
      saveLocation(data.location?.city ?? `${lat},${lon}`, lat, lon, data.location?.country, data.location?.timezone);
      saveWeatherCache(lat, lon, days, data);

      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
      });
    } catch (err) {
      if (attempt < 2) await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
      else return NextResponse.json({ error: err instanceof Error ? err.message : "Network error" }, { status: 500 });
    }
  }
}
