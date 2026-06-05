"use client";
import type { WeatherDay } from "@/types/weather";
import { getWeatherIcon, formatTemp } from "@/lib/utils/weather";

interface Props {
  daily: WeatherDay[];
}

export function ForecastTimeline({ daily }: Props) {
  const days = daily.slice(0, 7);
  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
        7-Day Forecast
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const label = i === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
          const isToday = i === 0;
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 py-3 px-1 transition-colors"
              style={{
                background: isToday ? "var(--bg-hover)" : "transparent",
                borderRadius: "5px",
                border: isToday ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: isToday ? "var(--accent)" : "var(--text-dim)" }}
              >
                {label}
              </p>
              <img
                src={day.icon}
                alt={String(day.condition_code)}
                className="w-7 h-7 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>{formatTemp(day.temp_max)}</p>
              <p className="text-xs tabular-nums" style={{ color: "var(--text-dim)" }}>{formatTemp(day.temp_min)}</p>
              {day.precipitation_probability > 15 && (
                <p className="text-xs font-medium tabular-nums" style={{ color: "var(--rain)" }}>
                  {day.precipitation_probability}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
