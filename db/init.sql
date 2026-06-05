-- AgriWeather AI — PostgreSQL schema
-- Auto-runs on first container start via docker-entrypoint-initdb.d

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Saved locations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  lat         NUMERIC(9,6) NOT NULL,
  lon         NUMERIC(9,6) NOT NULL,
  country     TEXT,
  timezone    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Weather cache ────────────────────────────────────────────────────────────
-- Stores raw API responses to reduce upstream calls and track history
CREATE TABLE IF NOT EXISTS weather_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat         NUMERIC(9,6) NOT NULL,
  lon         NUMERIC(9,6) NOT NULL,
  days        SMALLINT NOT NULL DEFAULT 7,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  payload     JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_coords
  ON weather_cache (lat, lon, days);

CREATE INDEX IF NOT EXISTS idx_weather_cache_expires
  ON weather_cache (expires_at);

-- ── Farmer profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farmers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT UNIQUE,
  email       TEXT UNIQUE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Farm plots ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id   UUID REFERENCES farmers(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  lat         NUMERIC(9,6) NOT NULL,
  lon         NUMERIC(9,6) NOT NULL,
  area_acres  NUMERIC(8,2),
  crop_id     TEXT,                        -- references crop profile id (app-level)
  county      TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plots_farmer ON plots(farmer_id);
CREATE INDEX IF NOT EXISTS idx_plots_crop ON plots(crop_id);

-- ── Tree analysis results ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tree_analyses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id           TEXT UNIQUE NOT NULL,   -- WeatherAI analysis_id
  plot_id               UUID REFERENCES plots(id) ON DELETE SET NULL,
  farmer_id             UUID REFERENCES farmers(id) ON DELETE SET NULL,
  county                TEXT,
  land_acres            NUMERIC(8,2),
  total_tree_count      INTEGER,
  tree_density_per_acre NUMERIC(8,2),
  confidence_score      NUMERIC(4,3),
  canopy_coverage_pct   NUMERIC(5,2),
  health_healthy        INTEGER,
  health_needs_care     INTEGER,
  health_needs_replacement INTEGER,
  tree_species_guess    TEXT,
  low_confidence        BOOLEAN DEFAULT FALSE,
  observations          JSONB,
  recommendations       JSONB,
  original_image_url    TEXT,
  overlay_image_url     TEXT,
  raw_response          JSONB,
  analyzed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tree_analyses_plot ON tree_analyses(plot_id);
CREATE INDEX IF NOT EXISTS idx_tree_analyses_farmer ON tree_analyses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_tree_analyses_date ON tree_analyses(analyzed_at DESC);

-- ── Farming recommendations log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id       UUID REFERENCES plots(id) ON DELETE SET NULL,
  crop_id       TEXT NOT NULL,
  weather_snapshot JSONB,
  recommendations  JSONB NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reco_plot ON recommendation_logs(plot_id);
CREATE INDEX IF NOT EXISTS idx_reco_date ON recommendation_logs(generated_at DESC);

-- ── API usage tracking ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan            TEXT,
  request_count   INTEGER,
  ai_request_count INTEGER,
  requests_limit  INTEGER,
  ai_limit        INTEGER,
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  snapshotted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Utility: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: sample location (Nairobi)
INSERT INTO locations (name, lat, lon, country, timezone)
VALUES ('Nairobi', -1.292100, 36.821900, 'KE', 'Africa/Nairobi')
ON CONFLICT DO NOTHING;
