export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  precipitation_probability: number;
  wind_max: number;
  condition_code: string;
  icon: string;
  icon_path: string;
  sunrise: string;
  sunset: string;
}

export interface HourlyData {
  time: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_gust: number;
  uv_index: number;
  condition_code: string;
  icon: string;
  icon_path: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  condition_code: string;
  icon: string;
  icon_path: string;
  // enriched from nearest hourly
  feels_like?: number;
  humidity?: number;
  uv_index?: number;
  wind_gust?: number;
}

export interface WeatherLocation {
  lat: number;
  lon: number;
  timezone?: string;
  country?: string;
  city?: string;
  region?: string;
}

export interface WeatherResponse {
  location: WeatherLocation;
  current: CurrentWeather;
  daily: WeatherDay[];
  hourly: HourlyData[];
}

export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
