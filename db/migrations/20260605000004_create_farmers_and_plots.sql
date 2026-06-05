CREATE TABLE IF NOT EXISTS farmers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT UNIQUE,
  email       TEXT UNIQUE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id  UUID REFERENCES farmers(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  lat        NUMERIC(9,6) NOT NULL,
  lon        NUMERIC(9,6) NOT NULL,
  area_acres NUMERIC(8,2),
  crop_id    TEXT,
  county     TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plots_farmer ON plots(farmer_id);
CREATE INDEX IF NOT EXISTS idx_plots_crop   ON plots(crop_id);
