import { NextRequest, NextResponse } from "next/server";
import { getWeatherClient } from "@/lib/api/weather-client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const days = parseInt(searchParams.get("days") ?? "7");
  const units = (searchParams.get("units") ?? "metric") as "metric" | "imperial";

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const client = getWeatherClient();
    const data = await client.getForecast({ lat, lon, days: Math.min(days, 7), units, ai: true });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch weather";
    const status = message.includes("Rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
