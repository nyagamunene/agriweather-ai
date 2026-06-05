export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  temp_avg: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
  description: string;
  uv_index: number;
  feels_like_max: number;
  feels_like_min: number;
}

export interface HourlyData {
  time: string;
  temp: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  weather_code: number;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  weather_code: number;
  description: string;
  uv_index: number;
  visibility: number;
  pressure: number;
  dew_point: number;
}

export interface WeatherLocation {
  lat: number;
  lon: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
}

export interface AISummary {
  summary: string;
  recommendations?: string[];
  risk_flags?: string[];
}

export interface WeatherResponse {
  location: WeatherLocation;
  current: CurrentWeather;
  daily: WeatherDay[];
  hourly?: HourlyData[];
  ai_summary?: AISummary | string;
  units: string;
}

export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
