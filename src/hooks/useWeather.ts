"use client";
import { useState, useCallback, useRef } from "react";
import type { WeatherResponse, GeocodingResult } from "@/types/weather";
import type { FarmingRecommendation, CropProfile, GrowthStage } from "@/types/crops";

interface UseWeatherReturn {
  weather: WeatherResponse | null;
  recommendations: FarmingRecommendation[];
  isLoading: boolean;
  recsLoading: boolean;
  error: string | null;
  recsError: string | null;
  fetchWeather: (lat: number, lon: number, location?: GeocodingResult) => Promise<void>;
  fetchRecommendations: (crop: CropProfile, growthStage?: GrowthStage | null) => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [recommendations, setRecommendations] = useState<FarmingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recsError, setRecsError] = useState<string | null>(null);
  const weatherRef = useRef<WeatherResponse | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number, location?: GeocodingResult) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        days: "7",
      });
      if (location?.name) params.set("name", location.name);
      if (location?.country) params.set("country", location.country);
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Error ${res.status}`);
      }
      const data: WeatherResponse = await res.json();

      // Enrich current with nearest hourly entry (API doesn't include humidity/uv/gust in current)
      if (data.hourly?.length) {
        const currentTime = data.current?.time ? new Date(data.current.time).getTime() : Date.now();
        const nearest = data.hourly.reduce((best, h) =>
          Math.abs(new Date(h.time).getTime() - currentTime) < Math.abs(new Date(best.time).getTime() - currentTime) ? h : best
        );
        data.current = {
          ...data.current,
          humidity: data.current.humidity ?? nearest.humidity,
          feels_like: data.current.feels_like ?? nearest.feels_like,
          uv_index: data.current.uv_index ?? nearest.uv_index,
          wind_gust: data.current.wind_gust ?? nearest.wind_gust,
        };
      }

      setWeather(data);
      weatherRef.current = data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async (crop: CropProfile, growthStage?: GrowthStage | null) => {
    const w = weatherRef.current;
    if (!w) return;
    setRecsLoading(true);
    setRecsError(null);
    setRecommendations([]);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: w.current, forecast: w.daily, crop, growthStage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecsError(data.error ?? `Error ${res.status}`);
        return;
      }
      setRecommendations(data.recommendations ?? []);
    } catch {
      setRecsError("Failed to reach recommendations service");
    } finally {
      setRecsLoading(false);
    }
  }, []);

  return { weather, recommendations, isLoading, recsLoading, error, recsError, fetchWeather, fetchRecommendations };
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (query.length < 2) return [];
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const { locations } = await res.json();
    return locations ?? [];
  } catch {
    return [];
  }
}
