CREATE TABLE IF NOT EXISTS locations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  lat        NUMERIC(9,6) NOT NULL,
  lon        NUMERIC(9,6) NOT NULL,
  country    TEXT,
  timezone   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
