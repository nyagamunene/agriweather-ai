import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
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
