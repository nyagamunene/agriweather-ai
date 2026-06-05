import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  sql = postgres(url, {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 3,
  });
  return sql;
}

export async function saveLocation(name: string, lat: number, lon: number, country?: string, timezone?: string) {
  try {
    const client = getSql();
    if (!client) return;
    try {
      await client`
        INSERT INTO locations (name, lat, lon, country, timezone)
        VALUES (${name}, ${lat}, ${lon}, ${country ?? null}, ${timezone ?? null})
      `;
    } catch {
      await client`
        UPDATE locations
        SET name = ${name},
            country = ${country ?? null},
            timezone = ${timezone ?? null},
            created_at = NOW()
        WHERE lat = ${lat}::numeric(9,6) AND lon = ${lon}::numeric(9,6)
      `;
    }
  } catch {
    // degrade gracefully when DB is unavailable
  }
}

export async function getRecentLocations(limit = 10) {
  try {
    const client = getSql();
    if (!client) return [];
    return await client`
      SELECT name, lat, lon, country, timezone, MAX(created_at) AS created_at
      FROM locations
      GROUP BY name, lat, lon, country, timezone
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}

export interface TreeAnalysisRow {
  analysis_id: string;
  county?: string;
  land_acres?: number;
  total_tree_count?: number;
  tree_density_per_acre?: number;
  confidence_score?: number;
  canopy_coverage_pct?: number;
  health_healthy?: number;
  health_needs_care?: number;
  health_needs_replacement?: number;
  tree_species_guess?: string;
  low_confidence?: boolean;
  observations?: string[];
  recommendations?: string[];
  original_image_url?: string;
  overlay_image_url?: string;
  analyzed_at?: string;
}

export async function saveTreeAnalysis(data: TreeAnalysisRow) {
  try {
    const client = getSql();
    if (!client) return;
    await client`
      INSERT INTO tree_analyses (
        analysis_id, county, land_acres, total_tree_count, tree_density_per_acre,
        confidence_score, canopy_coverage_pct, health_healthy, health_needs_care,
        health_needs_replacement, tree_species_guess, low_confidence,
        observations, recommendations, original_image_url, overlay_image_url, analyzed_at
      ) VALUES (
        ${data.analysis_id}, ${data.county ?? null}, ${data.land_acres ?? null},
        ${data.total_tree_count ?? null}, ${data.tree_density_per_acre ?? null},
        ${data.confidence_score ?? null}, ${data.canopy_coverage_pct ?? null},
        ${data.health_healthy ?? null}, ${data.health_needs_care ?? null},
        ${data.health_needs_replacement ?? null}, ${data.tree_species_guess ?? null},
        ${data.low_confidence ?? false},
        ${data.observations ?? null},
        ${data.recommendations ?? null},
        ${data.original_image_url ?? null}, ${data.overlay_image_url ?? null},
        ${data.analyzed_at ? new Date(data.analyzed_at).toISOString() : new Date().toISOString()}
      )
      ON CONFLICT (analysis_id) DO UPDATE SET
        original_image_url = EXCLUDED.original_image_url,
        overlay_image_url = EXCLUDED.overlay_image_url,
        analyzed_at = EXCLUDED.analyzed_at
    `;
  } catch {
    // degrade gracefully
  }
}

export async function getTreeAnalysisHistory(limit = 10): Promise<TreeAnalysisRow[]> {
  try {
    const client = getSql();
    if (!client) return [];
    const rows = await client<{
      analysis_id: string;
      county: string | null;
      land_acres: number | null;
      total_tree_count: number | null;
      tree_density_per_acre: number | null;
      confidence_score: number | null;
      canopy_coverage_pct: number | null;
      health_healthy: number | null;
      health_needs_care: number | null;
      health_needs_replacement: number | null;
      tree_species_guess: string | null;
      low_confidence: boolean | null;
      observations: string[] | null;
      recommendations: string[] | null;
      original_image_url: string | null;
      overlay_image_url: string | null;
      analyzed_at: string | null;
    }[]>`
      SELECT analysis_id, county, land_acres, total_tree_count, tree_density_per_acre,
             confidence_score, canopy_coverage_pct, health_healthy, health_needs_care,
             health_needs_replacement, tree_species_guess, low_confidence,
             observations, recommendations, original_image_url, overlay_image_url, analyzed_at
      FROM tree_analyses
      ORDER BY analyzed_at DESC
      LIMIT ${limit}
    `;
    return rows.map(r => ({
      analysis_id: r.analysis_id,
      county: r.county ?? undefined,
      land_acres: r.land_acres ?? undefined,
      total_tree_count: r.total_tree_count ?? undefined,
      tree_density_per_acre: r.tree_density_per_acre ?? undefined,
      confidence_score: r.confidence_score ?? undefined,
      canopy_coverage_pct: r.canopy_coverage_pct ?? undefined,
      health_healthy: r.health_healthy ?? undefined,
      health_needs_care: r.health_needs_care ?? undefined,
      health_needs_replacement: r.health_needs_replacement ?? undefined,
      tree_species_guess: r.tree_species_guess ?? undefined,
      low_confidence: r.low_confidence ?? undefined,
      observations: r.observations ?? undefined,
      recommendations: r.recommendations ?? undefined,
      original_image_url: r.original_image_url ?? undefined,
      overlay_image_url: r.overlay_image_url ?? undefined,
      analyzed_at: r.analyzed_at ? new Date(r.analyzed_at).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}

export async function saveWeatherCache(lat: number, lon: number, days: number, payload: unknown) {
  try {
    const client = getSql();
    if (!client) return;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await client`
      INSERT INTO weather_cache (lat, lon, days, payload, expires_at)
      VALUES (${lat}, ${lon}, ${days}, ${JSON.stringify(payload)}, ${expiresAt.toISOString()})
      ON CONFLICT (lat, lon, days) DO UPDATE SET
        payload = EXCLUDED.payload,
        expires_at = EXCLUDED.expires_at,
        fetched_at = NOW()
    `;
  } catch {
    // degrade gracefully
  }
}

export async function getWeatherCache(lat: number, lon: number, days: number): Promise<unknown | null> {
  try {
    const client = getSql();
    if (!client) return null;
    const rows = await client`
      SELECT payload FROM weather_cache
      WHERE lat = ${lat} AND lon = ${lon} AND days = ${days}
        AND expires_at > NOW()
      ORDER BY fetched_at DESC
      LIMIT 1
    `;
    return rows.length > 0 ? rows[0].payload : null;
  } catch {
    return null;
  }
}

// ── Farm plots ───────────────────────────────────────────────────────────────

export interface PlotRow {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area_acres: number | null;
  crop_id: string | null;
  county: string | null;
  notes: string | null;
  created_at: string;
}

export async function savePlot(data: {
  name: string;
  lat: number;
  lon: number;
  area_acres?: number | null;
  crop_id?: string | null;
  county?: string | null;
  notes?: string | null;
}): Promise<string | null> {
  try {
    const client = getSql();
    if (!client) return null;
    const rows = await client`
      INSERT INTO plots (name, lat, lon, area_acres, crop_id, county, notes)
      VALUES (
        ${data.name}, ${data.lat}, ${data.lon},
        ${data.area_acres ?? null}, ${data.crop_id ?? null},
        ${data.county ?? null}, ${data.notes ?? null}
      )
      RETURNING id
    `;
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function getPlots(): Promise<PlotRow[]> {
  try {
    const client = getSql();
    if (!client) return [];
    const rows = await client<{
      id: string; name: string; lat: string; lon: string;
      area_acres: string | null; crop_id: string | null;
      county: string | null; notes: string | null; created_at: string;
    }[]>`
      SELECT id, name, lat, lon, area_acres, crop_id, county, notes, created_at
      FROM plots
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      area_acres: r.area_acres !== null ? Number(r.area_acres) : null,
      crop_id: r.crop_id ?? null,
      county: r.county ?? null,
      notes: r.notes ?? null,
      created_at: new Date(r.created_at).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function deletePlot(id: string): Promise<boolean> {
  try {
    const client = getSql();
    if (!client) return false;
    await client`DELETE FROM plots WHERE id = ${id}`;
    return true;
  } catch {
    return false;
  }
}
