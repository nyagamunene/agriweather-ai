import type { WeatherResponse, WeatherDay, CurrentWeather, HourlyData } from "./weather";
import type { CropProfile, AgriculturalRisk, FarmingRecommendation } from "./crops";

export interface ReportData {
  generatedAt: string;
  location: {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
  };
  weather: {
    current: CurrentWeather;
    daily: WeatherDay[];
    hourly: HourlyData[];
  };
  crop: CropProfile | null;
  risks: AgriculturalRisk | null;
  recommendations: FarmingRecommendation[];
  summary: {
    avgTemp: number;
    totalRainfall: number;
    rainDays: number;
    maxWind: number;
    minTemp: number;
    maxTemp: number;
  };
}
