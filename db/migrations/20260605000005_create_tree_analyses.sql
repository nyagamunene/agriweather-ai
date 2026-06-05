CREATE TABLE IF NOT EXISTS tree_analyses (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id              TEXT UNIQUE NOT NULL,
  plot_id                  UUID REFERENCES plots(id) ON DELETE SET NULL,
  farmer_id                UUID REFERENCES farmers(id) ON DELETE SET NULL,
  county                   TEXT,
  land_acres               NUMERIC(8,2),
  total_tree_count         INTEGER,
  tree_density_per_acre    NUMERIC(8,2),
  confidence_score         NUMERIC(4,3),
  canopy_coverage_pct      NUMERIC(5,2),
  health_healthy           INTEGER,
  health_needs_care        INTEGER,
  health_needs_replacement INTEGER,
  tree_species_guess       TEXT,
  low_confidence           BOOLEAN DEFAULT FALSE,
  observations             JSONB,
  recommendations          JSONB,
  original_image_url       TEXT,
  overlay_image_url        TEXT,
  raw_response             JSONB,
  analyzed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tree_analyses_plot   ON tree_analyses(plot_id);
CREATE INDEX IF NOT EXISTS idx_tree_analyses_farmer ON tree_analyses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_tree_analyses_date   ON tree_analyses(analyzed_at DESC);
