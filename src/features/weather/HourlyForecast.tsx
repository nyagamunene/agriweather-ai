"use client";
import type { HourlyData } from "@/types/weather";
import { getWeatherIcon, formatTemp } from "@/lib/utils/weather";

interface Props {
  hourly: HourlyData[];
}

export function HourlyForecast({ hourly }: Props) {
  // Show next 24 hours from now
  const now = new Date();
  const upcoming = hourly
    .filter(h => new Date(h.time) >= now)
    .slice(0, 24);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">24-Hour Forecast</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {upcoming.map((h, i) => {
          const time = new Date(h.time);
          const isNow = i === 0;
          const label = isNow ? "Now" : time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
          return (
            <div
              key={h.time}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border shrink-0 min-w-[64px] transition-colors ${
                isNow
                  ? "bg-cyan-900/30 border-cyan-700/50"
                  : "bg-slate-800/40 border-slate-700/30"
              }`}
            >
              <p className={`text-xs font-semibold ${isNow ? "text-cyan-400" : "text-slate-500"}`}>{label}</p>
              <img
                src={h.icon}
                alt={h.condition_code}
                className="w-7 h-7 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-white text-sm font-bold">{formatTemp(h.temperature)}</p>
              {h.precipitation_probability > 15 && (
                <p className="text-cyan-400 text-xs">💧{h.precipitation_probability}%</p>
              )}
              {h.humidity !== undefined && (
                <p className="text-slate-600 text-xs">{h.humidity}%</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
