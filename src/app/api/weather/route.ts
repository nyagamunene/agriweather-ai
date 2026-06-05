import { NextRequest, NextResponse } from "next/server";

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
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `${BASE_URL}/v1/weather?lat=${lat}&lon=${lon}&days=${days}&ai=false`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 600 },
      });

      if (res.status === 429) {
        const reset = res.headers.get("X-RateLimit-Reset");
        return NextResponse.json({ error: `Rate limit exceeded. Resets at ${reset}` }, { status: 429 });
      }
      if (!res.ok) {
        lastError = `WeatherAI API error: ${res.status}`;
        if (attempt < 2) { await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt))); continue; }
        return NextResponse.json({ error: lastError }, { status: 502 });
      }

      const data = await res.json();

      // Enrich current weather with nearest hourly data for humidity, uv, feels_like
      const hourly: Array<Record<string, unknown>> = data.hourly ?? [];
      const now = new Date(data.current?.time ?? Date.now());
      const nearestHourly = hourly.find(h => {
        const t = new Date(h.time as string);
        return Math.abs(t.getTime() - now.getTime()) < 3600000;
      }) ?? hourly[Math.min(now.getHours(), hourly.length - 1)];

      if (nearestHourly && data.current) {
        data.current.feels_like = nearestHourly.feels_like;
        data.current.humidity = nearestHourly.humidity;
        data.current.uv_index = nearestHourly.uv_index;
        data.current.wind_gust = nearestHourly.wind_gust;
      }

      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      if (attempt < 2) await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
