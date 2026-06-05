import { NextRequest, NextResponse } from "next/server";
import { saveTreeAnalysis } from "@/lib/db";

export async function POST(req: NextRequest) {
  const apiKey = process.env.WEATHER_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  try {
    const form = await req.formData();
    const image = form.get("image") as File | null;
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const upstream = new FormData();
    upstream.append("image", image, image.name);
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

    // Persist analysis to DB (non-blocking, silent failure)
    saveTreeAnalysis({
      analysis_id: data.analysis_id,
      county: data.county,
      land_acres: data.land_acres,
      total_tree_count: data.total_tree_count,
      tree_density_per_acre: data.tree_density_per_acre,
      confidence_score: data.confidence_score,
      canopy_coverage_pct: data.canopy_coverage_pct,
      health_healthy: data.tree_health?.healthy,
      health_needs_care: data.tree_health?.needs_care,
      health_needs_replacement: data.tree_health?.needs_replacement,
      tree_species_guess: data.tree_species_guess,
      low_confidence: data.low_confidence,
      observations: data.observations,
      recommendations: data.recommendations,
      original_image_url: data.original_image_url,
      overlay_image_url: data.overlay_image_url,
    });

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
