CREATE TABLE IF NOT EXISTS recommendation_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id          UUID REFERENCES plots(id) ON DELETE SET NULL,
  crop_id          TEXT NOT NULL,
  weather_snapshot JSONB,
  recommendations  JSONB NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reco_plot ON recommendation_logs(plot_id);
CREATE INDEX IF NOT EXISTS idx_reco_date ON recommendation_logs(generated_at DESC);

-- Seed: default Nairobi location
INSERT INTO locations (name, lat, lon, country, timezone)
VALUES ('Nairobi', -1.292100, 36.821900, 'KE', 'Africa/Nairobi')
ON CONFLICT DO NOTHING;
