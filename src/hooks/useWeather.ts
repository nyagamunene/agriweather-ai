"use client";
import { useState, useCallback, useRef } from "react";
import type { WeatherResponse, GeocodingResult } from "@/types/weather";
import type { FarmingRecommendation } from "@/types/crops";
import type { CropProfile } from "@/types/crops";

interface UseWeatherReturn {
  weather: WeatherResponse | null;
  recommendations: FarmingRecommendation[];
  isLoading: boolean;
  error: string | null;
  fetchWeather: (lat: number, lon: number) => Promise<void>;
  fetchRecommendations: (crop: CropProfile) => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [recommendations, setRecommendations] = useState<FarmingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weatherRef = useRef<WeatherResponse | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&days=7`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fetch weather");
      }
      const data: WeatherResponse = await res.json();
      setWeather(data);
      weatherRef.current = data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async (crop: CropProfile) => {
    const w = weatherRef.current;
    if (!w) return;
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: w.current, forecast: w.daily, crop }),
      });
      if (!res.ok) return;
      const { recommendations: recs } = await res.json();
      setRecommendations(recs);
    } catch {
      // non-blocking
    }
  }, []);

  return { weather, recommendations, isLoading, error, fetchWeather, fetchRecommendations };
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (query.length < 2) return [];
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const { locations } = await res.json();
  return locations ?? [];
}
