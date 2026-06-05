"use client";
import type { CurrentWeather, WeatherLocation } from "@/types/weather";
import { getWeatherIcon, getWeatherDescription, formatTemp, getWindDirection } from "@/lib/utils/weather";

interface Props {
  current: CurrentWeather;
  location: WeatherLocation;
}

export function CurrentWeatherCard({ current, location }: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700/50 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Current Conditions</p>
          {location.city && (
            <h2 className="text-white text-xl font-semibold mt-1">
              {location.city}{location.region ? `, ${location.region}` : ""}{location.country ? `, ${location.country}` : ""}
            </h2>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-6xl">{getWeatherIcon(current.weather_code)}</span>
            <div>
              <p className="text-5xl font-bold text-white">{formatTemp(current.temp)}</p>
              <p className="text-slate-400 text-sm mt-1">{getWeatherDescription(current.weather_code)}</p>
              <p className="text-slate-500 text-xs">Feels like {formatTemp(current.feels_like)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MetricItem label="Humidity" value={`${current.humidity}%`} icon="💧" />
          <MetricItem label="Wind" value={`${current.wind_speed} km/h ${getWindDirection(current.wind_direction)}`} icon="💨" />
          <MetricItem label="UV Index" value={`${current.uv_index}`} icon="☀️" />
          <MetricItem label="Pressure" value={`${current.pressure} hPa`} icon="🌡️" />
          <MetricItem label="Visibility" value={`${current.visibility} km`} icon="👁️" />
          <MetricItem label="Dew Point" value={formatTemp(current.dew_point)} icon="🌫️" />
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/30">
      <p className="text-slate-500 text-xs">{icon} {label}</p>
      <p className="text-slate-200 font-medium text-sm mt-0.5">{value}</p>
    </div>
  );
}
