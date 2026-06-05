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
import { ReportGenerator } from "@/features/reports/ReportGenerator";
import { HistoryPanel } from "@/features/history/HistoryPanel";
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
type MainTab = "weather" | "crops" | "trees" | "reports" | "history";

const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: "temperature", label: "Temperature" },
  { id: "rainfall", label: "Rainfall" },
  { id: "wind", label: "Wind & Humidity" },
];

const MAIN_TABS: { id: MainTab; label: string; count?: string }[] = [
  { id: "weather", label: "Weather" },
  { id: "crops", label: "Crop Intelligence" },
  { id: "trees", label: "Tree Analysis" },
  { id: "reports", label: "Reports" },
  { id: "history", label: "History" },
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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }} className="sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-5 h-12">
            {/* Wordmark */}
            <div className="flex items-center gap-2.5 shrink-0 select-none">
              <div
                className="w-6 h-6 flex items-center justify-center text-sm font-black"
                style={{ background: "var(--accent)", color: "#0f0e0b", borderRadius: "3px", letterSpacing: "-0.02em" }}
              >
                A
              </div>
              <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text)" }}>
                AgriWeather<span style={{ color: "var(--accent)" }}>.</span>AI
              </span>
            </div>

            <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />

            {/* Location search */}
            <div className="flex-1 max-w-lg">
              <LocationSearch onSelect={handleLocationSelect} isLoading={isLoading} />
            </div>

            <div className="ml-auto flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--accent)" }}
                />
                <span className="hidden sm:block">Live</span>
              </div>
              <span className="text-xs hidden sm:block" style={{ color: "var(--text-dim)" }}>
                Free tier
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-0">
            {MAIN_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className="relative px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  color: mainTab === tab.id ? "var(--text)" : "var(--text-muted)",
                  borderBottom: mainTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-5 space-y-4">
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 text-sm"
            style={{ background: "rgba(168, 50, 50, 0.12)", border: "1px solid rgba(168, 50, 50, 0.4)", borderRadius: "6px", color: "#f87171" }}
          >
            <span className="font-mono text-xs">ERR</span>
            {error}
          </div>
        )}

        {isLoading && !weather && (
          <div className="space-y-4">
            <Skeleton height={168} />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} height={72} />)}
            </div>
            <Skeleton height={112} />
          </div>
        )}

        {/* ── WEATHER TAB ─────────────────────────────────────────────────── */}
        {mainTab === "weather" && weather && (
          <>
            <CurrentWeatherCard
              current={weather.current}
              location={{ ...weather.location, city: location.name.split(",")[0], region: location.state, country: location.country }}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Today's Range"
                value={today ? `${Math.round(today.temp_min)}° – ${Math.round(today.temp_max)}°` : "—"}
                unit="°C"
                meta="High / Low"
              />
              <StatTile
                label="7-Day Rainfall"
                value={`${weeklyRain.toFixed(1)}`}
                unit="mm"
                meta={`${rainDays} rainy day${rainDays !== 1 ? "s" : ""}`}
                accent="rain"
              />
              <StatTile
                label="Peak Wind"
                value={`${maxWind}`}
                unit="km/h"
                meta="This week"
              />
              <StatTile
                label="Sunrise / Set"
                value={today ? `${fmtTime(today.sunrise)}` : "—"}
                unit=""
                meta={today ? `Set ${fmtTime(today.sunset)}` : ""}
              />
            </div>

            {/* Hourly */}
            {weather.hourly && <HourlyForecast hourly={weather.hourly} />}

            {/* 7-day */}
            <ForecastTimeline daily={weather.daily} />

            {/* Charts */}
            <div style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
                  Weather Trends
                </span>
                <div className="flex gap-1">
                  {CHART_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveChart(tab.id)}
                      className="px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{
                        color: activeChart === tab.id ? "var(--accent)" : "var(--text-muted)",
                        background: activeChart === tab.id ? "var(--accent-glow)" : "transparent",
                        border: `1px solid ${activeChart === tab.id ? "var(--accent-dim)" : "transparent"}`,
                        borderRadius: "4px",
                      }}
                    >
                      {tab.label}
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

        {/* ── CROPS TAB ───────────────────────────────────────────────────── */}
        {mainTab === "crops" && weather && (
          <>
            <CropSelector selected={selectedCrop} onChange={setSelectedCrop} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecommendationsPanel recommendations={recommendations} cropName={selectedCrop?.name} />
              {risks ? (
                <RiskAnalysis risks={risks} />
              ) : (
                <EmptyState
                  icon="⚠"
                  title="No crop selected"
                  body="Select a crop above to view risk analysis for drought, flood, heat stress, frost, and disease."
                />
              )}
            </div>
          </>
        )}

        {mainTab === "crops" && !weather && !isLoading && (
          <EmptyState icon="◎" title="No location set" body="Search for a location first to unlock crop intelligence." />
        )}

        {/* ── TREES TAB ───────────────────────────────────────────────────── */}
        {mainTab === "trees" && (
          <TreeAnalysis quota={treeQuota ?? undefined} />
        )}

        {/* ── REPORTS TAB ─────────────────────────────────────────────────── */}
        {mainTab === "reports" && weather && (
          <ReportGenerator
            weather={weather}
            location={location}
            selectedCrop={selectedCrop}
            risks={risks}
            recommendations={recommendations}
          />
        )}

        {mainTab === "reports" && !weather && !isLoading && (
          <EmptyState icon="📄" title="No weather data" body="Search for a location first to generate reports." />
        )}

        {/* ── HISTORY TAB ─────────────────────────────────────────────────── */}
        {mainTab === "history" && (
          <HistoryPanel onLocationSelect={handleLocationSelect} />
        )}

        {/* Empty weather state */}
        {mainTab === "weather" && !weather && !isLoading && !error && (
          <div className="py-32 flex flex-col items-center gap-3 text-center">
            <div className="text-5xl font-black tracking-tighter" style={{ color: "var(--accent)", opacity: 0.3 }}>
              —
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Search a location to begin</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Enter a city, county, or region above</p>
          </div>
        )}
      </main>

      <footer
        className="mt-12 py-4 text-center text-xs"
        style={{ borderTop: "1px solid var(--border-soft)", color: "var(--text-dim)" }}
      >
        AgriWeather AI · Powered by{" "}
        <a
          href="https://weather-ai.co"
          style={{ color: "var(--text-muted)" }}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          WeatherAI
        </a>
        {" "}· Weather intelligence for smarter farming
      </footer>
    </div>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function Skeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded"
      style={{ height, background: "var(--bg-raised)", border: "1px solid var(--border-soft)" }}
    />
  );
}

function StatTile({ label, value, unit, meta, accent }: {
  label: string; value: string; unit: string; meta: string; accent?: "rain";
}) {
  const valColor = accent === "rain" ? "var(--rain)" : "var(--text)";
  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "6px" }}
      className="px-4 py-3"
    >
      <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-dim)" }}>{label}</p>
      <p className="text-xl font-bold tabular-nums leading-none" style={{ color: valColor }}>
        {value}<span className="text-sm font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>{unit}</span>
      </p>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-dim)" }}>{meta}</p>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 gap-2 text-center"
      style={{ border: "1px solid var(--border-soft)", background: "var(--bg-surface)", borderRadius: "8px" }}
    >
      <span className="text-2xl font-mono mb-1" style={{ color: "var(--text-dim)" }}>{icon}</span>
      <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{title}</p>
      <p className="text-xs max-w-64" style={{ color: "var(--text-dim)" }}>{body}</p>
    </div>
  );
}
