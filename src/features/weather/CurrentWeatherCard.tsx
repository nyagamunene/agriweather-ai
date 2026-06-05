"use client";
import type { CurrentWeather, WeatherLocation } from "@/types/weather";
import { getWeatherIcon, getWeatherDescription, formatTemp, getWindDirection, getUVLabel } from "@/lib/utils/weather";

interface Props {
  current: CurrentWeather;
  location: WeatherLocation;
}

export function CurrentWeatherCard({ current, location }: Props) {
  const city = [location.city].filter(Boolean).join("");
  const region = [location.region, location.country].filter(Boolean).join(", ");

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        borderRadius: "8px",
      }}
      className="p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-5">
        {/* Left: temperature block */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-mono px-1.5 py-0.5"
              style={{ background: "var(--bg-raised)", color: "var(--text-dim)", border: "1px solid var(--border-soft)", borderRadius: "3px" }}
            >
              LIVE
            </span>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Current Conditions</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-5xl leading-none select-none">{getWeatherIcon(current.condition_code)}</div>
            <div>
              <p
                className="font-black tracking-tighter leading-none"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--text)" }}
              >
                {formatTemp(current.temperature)}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {getWeatherDescription(current.condition_code)}
              </p>
              {current.feels_like !== undefined && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  Feels {formatTemp(current.feels_like)}
                </p>
              )}
            </div>
          </div>

          {/* Location label */}
          {city && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-base font-semibold leading-tight" style={{ color: "var(--text)" }}>{city}</p>
              {region && <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{region}</p>}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "var(--border-soft)" }} className="hidden sm:block" />

        {/* Right: metrics table */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-px" style={{ background: "var(--border-soft)", border: "1px solid var(--border-soft)", borderRadius: "6px", overflow: "hidden" }}>
          <Metric label="Humidity" value={current.humidity !== undefined ? `${current.humidity}%` : "—"} />
          <Metric label="Wind" value={`${current.wind_speed} km/h`} />
          <Metric label="Direction" value={getWindDirection(current.wind_direction)} />
          {current.wind_gust !== undefined && (
            <Metric label="Gusts" value={`${current.wind_gust} km/h`} />
          )}
          {current.uv_index !== undefined && (
            <Metric label="UV Index" value={`${current.uv_index.toFixed(1)} ${getUVLabel(current.uv_index)}`} />
          )}
          <Metric
            label="Updated"
            value={current.time ? new Date(current.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5" style={{ background: "var(--bg-raised)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-dim)" }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}
