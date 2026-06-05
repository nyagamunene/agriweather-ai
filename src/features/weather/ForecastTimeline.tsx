"use client";
import type { WeatherDay } from "@/types/weather";
import { getWeatherIcon, formatDate, formatTemp } from "@/lib/utils/weather";

interface Props {
  daily: WeatherDay[];
}

export function ForecastTimeline({ daily }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">7-Day Forecast</p>
      <div className="grid grid-cols-7 gap-2">
        {daily.slice(0, 7).map((day, i) => (
          <div
            key={day.date}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
              i === 0 ? "bg-emerald-900/30 border border-emerald-700/40" : "bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40"
            }`}
          >
            <p className="text-slate-400 text-xs font-medium">{i === 0 ? "Today" : formatDate(day.date).split(",")[0]}</p>
            <span className="text-2xl">{getWeatherIcon(day.weather_code)}</span>
            <p className="text-white text-sm font-semibold">{formatTemp(day.temp_max)}</p>
            <p className="text-slate-500 text-xs">{formatTemp(day.temp_min)}</p>
            {day.precipitation_probability > 20 && (
              <p className="text-cyan-400 text-xs">💧 {day.precipitation_probability}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
