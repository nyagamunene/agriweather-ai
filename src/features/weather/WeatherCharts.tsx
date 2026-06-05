"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, ReferenceLine,
} from "recharts";
import type { WeatherDay } from "@/types/weather";

interface Props { daily: WeatherDay[] }

function dayLabel(dateStr: string, i: number) {
  if (i === 0) return "Today";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

const tooltipStyle = {
  contentStyle: { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0", fontSize: 12 },
  cursor: { stroke: "#334155", strokeWidth: 1 },
};

export function TemperatureChart({ daily }: Props) {
  const data = daily.map((d, i) => ({
    date: dayLabel(d.date, i),
    Max: Math.round(d.temp_max),
    Min: Math.round(d.temp_min),
    Avg: Math.round((d.temp_max + d.temp_min) / 2),
  }));

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} unit="°" axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
          <Area type="monotone" dataKey="Max" stroke="#f97316" strokeWidth={2.5} fill="url(#gMax)" dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="Avg" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="4 3" dot={false} />
          <Area type="monotone" dataKey="Min" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gMin)" dot={{ fill: "#06b6d4", r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RainfallChart({ daily }: Props) {
  const data = daily.map((d, i) => ({
    date: dayLabel(d.date, i),
    "Rainfall (mm)": parseFloat(d.precipitation_sum.toFixed(1)),
    "Chance (%)": d.precipitation_probability,
  }));

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="mm" tick={{ fill: "#64748b", fontSize: 11 }} unit="mm" axisLine={false} tickLine={false} />
          <YAxis yAxisId="pct" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
          <Bar yAxisId="mm" dataKey="Rainfall (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="pct" dataKey="Chance (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HumidityChart({ daily }: Props) {
  const data = daily.map((d, i) => ({
    date: dayLabel(d.date, i),
    "Wind (km/h)": Math.round(d.wind_max),
    "Rain Chance (%)": d.precipitation_probability,
  }));

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gRain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="wind" tick={{ fill: "#64748b", fontSize: 11 }} unit=" km/h" axisLine={false} tickLine={false} />
          <YAxis yAxisId="rain" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
          <ReferenceLine yAxisId="wind" y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "High wind", fill: "#ef4444", fontSize: 10 }} />
          <Area yAxisId="wind" type="monotone" dataKey="Wind (km/h)" stroke="#a78bfa" strokeWidth={2.5} fill="url(#gWind)" dot={{ fill: "#a78bfa", r: 3 }} activeDot={{ r: 5 }} />
          <Area yAxisId="rain" type="monotone" dataKey="Rain Chance (%)" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gRain)" dot={{ fill: "#06b6d4", r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
