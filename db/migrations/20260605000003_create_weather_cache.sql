CREATE TABLE IF NOT EXISTS weather_cache (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat        NUMERIC(9,6) NOT NULL,
  lon        NUMERIC(9,6) NOT NULL,
  days       SMALLINT NOT NULL DEFAULT 7,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payload    JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_coords  ON weather_cache (lat, lon, days);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache (expires_at);
