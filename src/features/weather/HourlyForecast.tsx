"use client";
import type { HourlyData } from "@/types/weather";
import { getWeatherIcon, formatTemp } from "@/lib/utils/weather";

interface Props {
  hourly: HourlyData[];
}

export function HourlyForecast({ hourly }: Props) {
  const now = new Date();
  const upcoming = hourly
    .filter(h => new Date(h.time) >= now)
    .slice(0, 24);

  if (upcoming.length === 0) return null;

  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
        24-Hour Forecast
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {upcoming.map((h, i) => {
          const time = new Date(h.time);
          const isNow = i === 0;
          const label = isNow ? "Now" : time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
          return (
            <div
              key={h.time}
              className="flex flex-col items-center gap-1.5 py-2.5 px-2.5 shrink-0 transition-colors"
              style={{
                minWidth: "60px",
                background: isNow ? "var(--accent-glow)" : "var(--bg-raised)",
                border: `1px solid ${isNow ? "var(--accent-dim)" : "var(--border-soft)"}`,
                borderRadius: "5px",
              }}
            >
              <p
                className="text-xs font-semibold tabular-nums"
                style={{ color: isNow ? "var(--accent)" : "var(--text-dim)" }}
              >
                {label}
              </p>
              <img
                src={h.icon}
                alt={h.condition_code}
                className="w-6 h-6 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
                {formatTemp(h.temperature)}
              </p>
              {h.precipitation_probability > 15 && (
                <p className="text-xs font-medium" style={{ color: "var(--rain)" }}>
                  {h.precipitation_probability}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
