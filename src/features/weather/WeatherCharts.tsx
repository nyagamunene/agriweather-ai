"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { WeatherDay } from "@/types/weather";
import { formatDate } from "@/lib/utils/weather";

interface Props {
  daily: WeatherDay[];
}

export function TemperatureChart({ daily }: Props) {
  const data = daily.map((d) => ({
    date: formatDate(d.date),
    max: Math.round(d.temp_max),
    min: Math.round(d.temp_min),
    avg: Math.round(d.temp_avg),
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tempMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tempMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} unit="°C" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }}
            formatter={(v) => [`${v}°C`]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Area type="monotone" dataKey="max" stroke="#f97316" strokeWidth={2} fill="url(#tempMax)" name="Max" />
          <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} fill="none" name="Avg" strokeDasharray="4 2" />
          <Area type="monotone" dataKey="min" stroke="#06b6d4" strokeWidth={2} fill="url(#tempMin)" name="Min" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RainfallChart({ daily }: Props) {
  const data = daily.map((d) => ({
    date: formatDate(d.date),
    rainfall: parseFloat(d.precipitation.toFixed(1)),
    probability: d.precipitation_probability,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} unit="mm" />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar yAxisId="left" dataKey="rainfall" fill="#3b82f6" name="Rainfall (mm)" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="right" dataKey="probability" fill="#8b5cf6" name="Probability (%)" radius={[3, 3, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HumidityChart({ daily }: Props) {
  const data = daily.map((d) => ({
    date: formatDate(d.date),
    humidity: Math.round(d.humidity),
    windSpeed: Math.round(d.wind_speed),
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} unit="%" domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} unit=" km/h" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Area yAxisId="left" type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} fill="url(#humidGrad)" name="Humidity (%)" />
          <Area yAxisId="right" type="monotone" dataKey="windSpeed" stroke="#a78bfa" strokeWidth={2} fill="none" name="Wind (km/h)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
