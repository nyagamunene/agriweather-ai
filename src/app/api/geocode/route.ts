import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const reverse = params.get("reverse") === "1";

  if (reverse) {
    const lat = parseFloat(params.get("lat") ?? "");
    const lon = parseFloat(params.get("lon") ?? "");
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "lat and lon required for reverse geocode" }, { status: 400 });
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "AgriWeatherAI/1.0 (agricultural-intelligence)" },
      });
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const r = await res.json() as Record<string, unknown>;
      return NextResponse.json({
        locations: [{
          name: r.display_name as string,
          lat,
          lon,
          country: (r.address as Record<string, string>)?.country ?? "",
          state: (r.address as Record<string, string>)?.state ?? "",
        }],
      });
    } catch {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 503 });
    }
  }

  const query = params.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AgriWeatherAI/1.0 (agricultural-intelligence)" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error("Geocoding failed");

    const results = await res.json();
    const locations = results.map((r: Record<string, unknown>) => ({
      name: r.display_name as string,
      lat: parseFloat(r.lat as string),
      lon: parseFloat(r.lon as string),
      country: (r.address as Record<string, string>)?.country ?? "",
      state: (r.address as Record<string, string>)?.state ?? "",
    }));

    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 503 });
  }
}
