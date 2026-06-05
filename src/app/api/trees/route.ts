import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.WEATHER_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  try {
    const form = await req.formData();
    const image = form.get("image") as File | null;
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Forward multipart form to WeatherAI
    const upstream = new FormData();
    upstream.append("image", image, image.name);
    // optional fields
    for (const field of ["farmerId", "county", "landAcres", "location", "notes"]) {
      const val = form.get(field);
      if (val) upstream.append(field, val as string);
    }

    const res = await fetch("https://api.weather-ai.co/v1/trees/analyze", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error ?? `API error ${res.status}` }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  const apiKey = process.env.WEATHER_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const [quotaRes, historyRes] = await Promise.all([
    fetch("https://api.weather-ai.co/v1/trees/quota", { headers: { Authorization: `Bearer ${apiKey}` } }),
    fetch("https://api.weather-ai.co/v1/trees/history?limit=5", { headers: { Authorization: `Bearer ${apiKey}` } }),
  ]);

  const quota = quotaRes.ok ? await quotaRes.json() : null;
  const history = historyRes.ok ? await historyRes.json() : null;
  return NextResponse.json({ quota, history });
}
