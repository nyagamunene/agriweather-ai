"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeather } from "@/hooks/useWeather";
import { LocationSearch } from "@/components/LocationSearch";
import { CurrentWeatherCard } from "@/features/weather/CurrentWeatherCard";
import { ForecastTimeline } from "@/features/weather/ForecastTimeline";
import { HourlyForecast } from "@/features/weather/HourlyForecast";
import { TemperatureChart, RainfallChart, HumidityChart } from "@/features/weather/WeatherCharts";
import { CropSelector } from "@/features/crops/CropSelector";
import { RecommendationsPanel } from "@/features/ai/RecommendationsPanel";
import { RiskAnalysis } from "@/features/ai/RiskAnalysis";
import { TreeAnalysis } from "@/features/trees/TreeAnalysis";
import { calculateRisks } from "@/features/crops/risk-calculator";
import type { CropProfile, AgriculturalRisk } from "@/types/crops";
import type { GeocodingResult } from "@/types/weather";
import { cn } from "@/lib/utils/cn";

const DEFAULT_LOCATION: GeocodingResult = {
  name: "Nairobi, Nairobi County, Kenya",
  lat: -1.2921,
  lon: 36.8219,
  country: "Kenya",
  state: "Nairobi County",
};

type ChartTab = "temperature" | "rainfall" | "wind";
type MainTab = "weather" | "crops" | "trees";

const CHART_TABS: { id: ChartTab; label: string; icon: string }[] = [
  { id: "temperature", label: "Temperature", icon: "🌡️" },
  { id: "rainfall", label: "Rainfall", icon: "🌧️" },
  { id: "wind", label: "Wind & Rain", icon: "💨" },
];

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: "weather", label: "Weather", icon: "🌤️" },
  { id: "crops", label: "Crop Intelligence", icon: "🌾" },
  { id: "trees", label: "Tree Analysis", icon: "🌳" },
];

export default function DashboardPage() {
  const { weather, recommendations, isLoading, error, fetchWeather, fetchRecommendations } = useWeather();
  const [selectedCrop, setSelectedCrop] = useState<CropProfile | null>(null);
  const [risks, setRisks] = useState<AgriculturalRisk | null>(null);
  const [activeChart, setActiveChart] = useState<ChartTab>("temperature");
  const [mainTab, setMainTab] = useState<MainTab>("weather");
  const [location, setLocation] = useState<GeocodingResult>(DEFAULT_LOCATION);
  const [treeQuota, setTreeQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  useEffect(() => {
    fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
    fetch("/api/trees").then(r => r.ok ? r.json() : null).then(d => { if (d?.quota) setTreeQuota(d.quota); });
  }, [fetchWeather]);

  useEffect(() => {
    if (weather && selectedCrop) {
      setRisks(calculateRisks(weather.daily, selectedCrop));
      fetchRecommendations(selectedCrop);
    }
  }, [weather, selectedCrop, fetchRecommendations]);

  const handleLocationSelect = useCallback(async (loc: GeocodingResult) => {
    setLocation(loc);
    await fetchWeather(loc.lat, loc.lon);
  }, [fetchWeather]);

  const today = weather?.daily?.[0];
  const weeklyRain = weather?.daily?.reduce((s, d) => s + d.precipitation_sum, 0) ?? 0;
  const maxWind = weather?.daily ? Math.max(...weather.daily.map(d => d.wind_max)) : 0;
  const rainDays = weather?.daily?.filter(d => d.precipitation_sum > 1).length ?? 0;

  return (
    <div className="min-h-screen bg-[#060d1a]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#060d1a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg">🌾</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">AgriWeather AI</p>
              <p className="text-slate-500 text-xs">Weather intelligence for farming</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <LocationSearch onSelect={handleLocationSelect} isLoading={isLoading} />
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:block">Live</span>
          </div>
        </div>

        {/* Main tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pb-3">
          {MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                mainTab === tab.id
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-700/40 p-4 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isLoading && !weather && (
          <div className="space-y-5 animate-pulse">
            <div className="h-44 bg-slate-800/60 rounded-2xl" />
            <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />)}</div>
            <div className="h-28 bg-slate-800/60 rounded-2xl" />
          </div>
        )}

        {/* ── WEATHER TAB ─────────────────────────────────────────────── */}
        {mainTab === "weather" && weather && (
          <>
            <CurrentWeatherCard
              current={weather.current}
              location={{ ...weather.location, city: location.name.split(",")[0], region: location.state, country: location.country }}
            />

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon="🌡️" label="Today's Range" value={today ? `${Math.round(today.temp_min)}° – ${Math.round(today.temp_max)}°C` : "--"} sub="Min / Max" color="orange" />
              <StatCard icon="🌧️" label="7-Day Rainfall" value={`${weeklyRain.toFixed(1)} mm`} sub={`${rainDays} rainy day${rainDays !== 1 ? "s" : ""}`} color="blue" />
              <StatCard icon="💨" label="Peak Wind" value={`${maxWind} km/h`} sub="This week" color="purple" />
              <StatCard icon="🌅" label="Sunrise / Set" value={today ? `${fmtTime(today.sunrise)} / ${fmtTime(today.sunset)}` : "--"} sub="Today" color="yellow" />
            </div>

            {/* Hourly */}
            {weather.hourly && <HourlyForecast hourly={weather.hourly} />}

            {/* 7-day */}
            <ForecastTimeline daily={weather.daily} />

            {/* Charts */}
            <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Weather Trends</p>
                <div className="flex gap-1.5">
                  {CHART_TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveChart(tab.id)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", activeChart === tab.id ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/40")}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {activeChart === "temperature" && <TemperatureChart daily={weather.daily} />}
              {activeChart === "rainfall" && <RainfallChart daily={weather.daily} />}
              {activeChart === "wind" && <HumidityChart daily={weather.daily} />}
            </div>
          </>
        )}

        {/* ── CROPS TAB ───────────────────────────────────────────────── */}
        {mainTab === "crops" && weather && (
          <>
            <CropSelector selected={selectedCrop} onChange={setSelectedCrop} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RecommendationsPanel recommendations={recommendations} cropName={selectedCrop?.name} />
              {risks ? (
                <RiskAnalysis risks={risks} />
              ) : (
                <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5 flex flex-col items-center justify-center min-h-[200px] gap-3">
                  <span className="text-4xl">🌿</span>
                  <p className="text-slate-400 text-sm font-medium">Select a crop above to view risk analysis</p>
                  <p className="text-slate-600 text-xs text-center">Drought, flood, heat stress, frost and disease risks will appear here</p>
                </div>
              )}
            </div>
          </>
        )}

        {mainTab === "crops" && !weather && !isLoading && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-3xl mb-3">🌾</p>
            <p className="text-sm">Search a location first to get crop recommendations</p>
          </div>
        )}

        {/* ── TREES TAB ───────────────────────────────────────────────── */}
        {mainTab === "trees" && (
          <TreeAnalysis quota={treeQuota ?? undefined} />
        )}

        {/* Empty state */}
        {mainTab === "weather" && !weather && !isLoading && !error && (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-slate-300 text-xl font-semibold">Search a location to get started</p>
            <p className="text-slate-500 text-sm mt-2">Enter a city or region above to view live weather intelligence</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/40 mt-10 py-5 text-center text-slate-600 text-xs">
        AgriWeather AI · Powered by{" "}
        <a href="https://weather-ai.co" className="text-emerald-700 hover:text-emerald-500 transition-colors" target="_blank" rel="noopener noreferrer">WeatherAI</a>
        {" "}· Weather intelligence for smarter farming
      </footer>
    </div>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: "orange" | "blue" | "purple" | "yellow" }) {
  const colors = { orange: "from-orange-500/10 to-orange-500/5 border-orange-700/30", blue: "from-blue-500/10 to-blue-500/5 border-blue-700/30", purple: "from-purple-500/10 to-purple-500/5 border-purple-700/30", yellow: "from-yellow-500/10 to-yellow-500/5 border-yellow-700/30" };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-4`}>
      <div className="flex items-center gap-2 mb-2"><span className="text-base">{icon}</span><p className="text-slate-500 text-xs font-medium">{label}</p></div>
      <p className="text-white font-bold text-lg leading-tight">{value}</p>
      <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
    </div>
  );
}
