"use client";
import type { WeatherDay } from "@/types/weather";
import { getWeatherIcon, formatTemp } from "@/lib/utils/weather";

interface Props {
  daily: WeatherDay[];
}

export function ForecastTimeline({ daily }: Props) {
  const days = daily.slice(0, 7);
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">7-Day Forecast</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const label = i === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                i === 0
                  ? "bg-emerald-900/30 border-emerald-700/50 shadow-lg shadow-emerald-900/20"
                  : "bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/40"
              }`}
            >
              <p className={`text-xs font-semibold ${i === 0 ? "text-emerald-400" : "text-slate-400"}`}>{label}</p>
              <img
                src={day.icon}
                alt={String(day.condition_code)}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-white text-sm font-bold">{formatTemp(day.temp_max)}</p>
              <p className="text-slate-500 text-xs">{formatTemp(day.temp_min)}</p>
              {day.precipitation_probability > 15 && (
                <p className="text-cyan-400 text-xs font-medium">💧{day.precipitation_probability}%</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
