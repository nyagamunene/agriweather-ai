"use client";
import type { CurrentWeather, WeatherLocation } from "@/types/weather";
import { getWeatherIcon, getWeatherDescription, formatTemp, getWindDirection, getUVLabel } from "@/lib/utils/weather";

interface Props {
  current: CurrentWeather;
  location: WeatherLocation;
}

export function CurrentWeatherCard({ current, location }: Props) {
  const locationLabel = [location.city, location.region, location.country].filter(Boolean).join(", ");

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur border border-slate-700/50 p-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        {/* Left: main temp */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Current Conditions</p>
          </div>
          {locationLabel && (
            <h2 className="text-white text-lg font-semibold mt-1 mb-4">{locationLabel}</h2>
          )}
          <div className="flex items-center gap-4">
            <div className="text-7xl leading-none">{getWeatherIcon(current.condition_code)}</div>
            <div>
              <p className="text-6xl font-bold text-white tracking-tight">{formatTemp(current.temperature)}</p>
              <p className="text-slate-300 text-base mt-1">{getWeatherDescription(current.condition_code)}</p>
              {current.feels_like !== undefined && (
                <p className="text-slate-500 text-sm mt-0.5">Feels like {formatTemp(current.feels_like)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <MetricCard icon="💧" label="Humidity" value={current.humidity !== undefined ? `${current.humidity}%` : "--"} />
          <MetricCard icon="💨" label="Wind" value={`${current.wind_speed} km/h ${getWindDirection(current.wind_direction)}`} />
          {current.wind_gust !== undefined && (
            <MetricCard icon="🌬️" label="Gusts" value={`${current.wind_gust} km/h`} />
          )}
          {current.uv_index !== undefined && (
            <MetricCard icon="☀️" label="UV Index" value={`${current.uv_index.toFixed(1)} · ${getUVLabel(current.uv_index)}`} />
          )}
          <MetricCard icon="🧭" label="Direction" value={`${current.wind_direction}° ${getWindDirection(current.wind_direction)}`} />
          <MetricCard icon="🕐" label="Updated" value={current.time ? new Date(current.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--"} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40 min-w-[110px]">
      <p className="text-slate-500 text-xs mb-1">{icon} {label}</p>
      <p className="text-slate-200 font-semibold text-sm leading-tight">{value}</p>
    </div>
  );
}
