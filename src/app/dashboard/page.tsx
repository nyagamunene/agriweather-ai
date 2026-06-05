"use client";
import { useState, useEffect } from "react";
import { useWeather } from "@/hooks/useWeather";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeatherCard } from "@/features/weather/CurrentWeatherCard";
import { ForecastTimeline } from "@/features/weather/ForecastTimeline";
import { TemperatureChart, RainfallChart, HumidityChart } from "@/features/weather/WeatherCharts";
import { CropSelector } from "@/features/crops/CropSelector";
import { RecommendationsPanel } from "@/features/ai/RecommendationsPanel";
import { RiskAnalysis } from "@/features/ai/RiskAnalysis";
import { calculateRisks } from "@/features/crops/risk-calculator";
import type { CropProfile, AgriculturalRisk } from "@/types/crops";
import type { GeocodingResult } from "@/types/weather";

const DEFAULT_LOCATION: GeocodingResult = {
  name: "Nairobi, Nairobi County, Kenya",
  lat: -1.2921,
  lon: 36.8219,
  country: "Kenya",
  state: "Nairobi County",
};

export default function DashboardPage() {
  const { weather, recommendations, isLoading, error, fetchWeather, fetchRecommendations } = useWeather();
  const [selectedCrop, setSelectedCrop] = useState<CropProfile | null>(null);
  const [risks, setRisks] = useState<AgriculturalRisk | null>(null);
  const [activeChart, setActiveChart] = useState<"temperature" | "rainfall" | "humidity">("temperature");
  const [location, setLocation] = useState<GeocodingResult>(DEFAULT_LOCATION);

  useEffect(() => {
    fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
  }, [fetchWeather]);

  useEffect(() => {
    if (weather && selectedCrop) {
      setRisks(calculateRisks(weather.daily, selectedCrop));
      fetchRecommendations(selectedCrop);
    }
  }, [weather, selectedCrop, fetchRecommendations]);

  async function handleLocationSelect(loc: GeocodingResult) {
    setLocation(loc);
    await fetchWeather(loc.lat, loc.lon);
  }

  function handleCropSelect(crop: CropProfile) {
    setSelectedCrop(crop);
  }

  const aiSummary = weather?.ai_summary
    ? typeof weather.ai_summary === "string"
      ? weather.ai_summary
      : weather.ai_summary.summary
    : undefined;

  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#060d1a]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
              🌾
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AgriWeather AI</p>
              <p className="text-slate-500 text-xs">Weather intelligence for smarter farming</p>
            </div>
          </div>
          <LocationSearch onSelect={handleLocationSelect} isLoading={isLoading} />
          <div className="shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-xs hidden sm:block">Live</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-700/40 p-4 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !weather && (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-slate-800/60 rounded-2xl" />
            <div className="h-32 bg-slate-800/60 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-72 bg-slate-800/60 rounded-2xl col-span-2" />
              <div className="h-72 bg-slate-800/60 rounded-2xl" />
            </div>
          </div>
        )}

        {weather && (
          <>
            {/* Current conditions + forecast */}
            <CurrentWeatherCard current={weather.current} location={{ ...weather.location, city: location.name.split(",")[0], region: location.state, country: location.country }} />
            <ForecastTimeline daily={weather.daily} />

            {/* Charts */}
            <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-2">
                  {(["temperature", "rainfall", "humidity"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        activeChart === tab
                          ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {tab === "temperature" ? "🌡️" : tab === "rainfall" ? "🌧️" : "💧"} {tab}
                    </button>
                  ))}
                </div>
              </div>
              {activeChart === "temperature" && <TemperatureChart daily={weather.daily} />}
              {activeChart === "rainfall" && <RainfallChart daily={weather.daily} />}
              {activeChart === "humidity" && <HumidityChart daily={weather.daily} />}
            </div>

            {/* Crop selector */}
            <CropSelector selected={selectedCrop} onChange={handleCropSelect} />

            {/* Lower grid: recommendations + risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecommendationsPanel
                recommendations={recommendations}
                aiSummary={aiSummary}
                cropName={selectedCrop?.name}
              />
              {risks ? (
                <RiskAnalysis risks={risks} />
              ) : (
                <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <p className="text-3xl mb-2">🌿</p>
                    <p className="text-sm">Select a crop above to view risk analysis</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI weather summary */}
            {aiSummary && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-950/30 to-cyan-950/30 border border-emerald-800/30 p-5">
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2">🤖 AI Weather Summary · Powered by WeatherAI</p>
                <p className="text-slate-300 text-sm leading-relaxed">{aiSummary}</p>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!weather && !isLoading && !error && (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🌾</p>
            <p className="text-lg font-medium text-slate-400">Search a location to get started</p>
            <p className="text-sm mt-1">Enter a city or region to view weather intelligence</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/60 mt-12 py-6 text-center text-slate-600 text-xs">
        AgriWeather AI · Powered by <a href="https://weather-ai.co" className="text-emerald-600 hover:text-emerald-500" target="_blank" rel="noopener noreferrer">WeatherAI</a> · Weather intelligence for smarter farming
      </footer>
    </div>
  );
}
