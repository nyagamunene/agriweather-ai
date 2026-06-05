import { NextRequest, NextResponse } from "next/server";
import { savePlot, getPlots, deletePlot } from "@/lib/db";
import { CROPS } from "@/features/crops/data";

const PLOTS_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(fallback), PLOTS_TIMEOUT_MS);
    promise
      .then(value => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeout));
  });
}

export async function GET() {
  try {
    const plots = await withTimeout(getPlots(), []);
    const enriched = plots.map(p => {
      const crop = p.crop_id ? CROPS.find(c => c.id === p.crop_id) : null;
      return {
        ...p,
        crop_name: crop?.name ?? null,
        crop_emoji: crop?.emoji ?? null,
      };
    });
    return NextResponse.json({ plots: enriched });
  } catch {
    return NextResponse.json({ plots: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lat, lon, area_acres, crop_id, county, notes } = body;
    if (!name || typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "name, lat and lon are required" }, { status: 400 });
    }
    const id = await savePlot({ name, lat, lon, area_acres, crop_id, county, notes });
    if (!id) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const crop = crop_id ? CROPS.find(c => c.id === crop_id) : null;
    return NextResponse.json({
      plot: { id, name, lat, lon, area_acres: area_acres ?? null, crop_id: crop_id ?? null, crop_name: crop?.name ?? null, crop_emoji: crop?.emoji ?? null, county: county ?? null, notes: notes ?? null },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const ok = await deletePlot(id);
  if (!ok) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
