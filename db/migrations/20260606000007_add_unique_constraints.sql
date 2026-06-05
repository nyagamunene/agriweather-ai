ALTER TABLE locations ADD CONSTRAINT IF NOT EXISTS locations_lat_lon_unique UNIQUE (lat, lon);
ALTER TABLE weather_cache ADD CONSTRAINT IF NOT EXISTS weather_cache_lat_lon_days_unique UNIQUE (lat, lon, days);
