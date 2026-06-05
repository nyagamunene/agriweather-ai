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
  contentStyle: {
    backgroundColor: "#1d1b17",
    border: "1px solid #2a2520",
    borderRadius: "5px",
    color: "#f0ece3",
    fontSize: 12,
    padding: "8px 12px",
  },
  cursor: { stroke: "#2a2520", strokeWidth: 1 },
};

const tickStyle = { fill: "#4a4540", fontSize: 11 };

export function TemperatureChart({ daily }: Props) {
  const data = daily.map((d, i) => ({
    date: dayLabel(d.date, i),
    Max: Math.round(d.temp_max),
    Min: Math.round(d.temp_min),
    Avg: Math.round((d.temp_max + d.temp_min) / 2),
  }));

  return (
    <div className="h-56 min-w-0" style={{ minHeight: 224 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c4623a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c4623a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a7fb0" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4a7fb0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#1f1d19" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} unit="°" axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a8070", paddingTop: 8 }} />
          <Area type="monotone" dataKey="Max" stroke="#c4623a" strokeWidth={2} fill="url(#gMax)" dot={{ fill: "#c4623a", r: 2.5 }} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="Avg" stroke="#d4a517" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
          <Area type="monotone" dataKey="Min" stroke="#4a7fb0" strokeWidth={2} fill="url(#gMin)" dot={{ fill: "#4a7fb0", r: 2.5 }} activeDot={{ r: 4 }} />
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
    <div className="h-56 min-w-0" style={{ minHeight: 224 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#1f1d19" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="mm" tick={tickStyle} unit="mm" axisLine={false} tickLine={false} />
          <YAxis yAxisId="pct" orientation="right" tick={tickStyle} unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a8070", paddingTop: 8 }} />
          <Bar yAxisId="mm" dataKey="Rainfall (mm)" fill="#4a7fb0" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="pct" dataKey="Chance (%)" fill="#2a4a6a" radius={[3, 3, 0, 0]} opacity={0.85} />
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
    <div className="h-56 min-w-0" style={{ minHeight: 224 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4a517" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d4a517" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gRain2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a7fb0" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4a7fb0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#1f1d19" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="wind" tick={tickStyle} unit=" km/h" axisLine={false} tickLine={false} />
          <YAxis yAxisId="rain" orientation="right" tick={tickStyle} unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a8070", paddingTop: 8 }} />
          <ReferenceLine yAxisId="wind" y={40} stroke="#a83232" strokeDasharray="3 3" label={{ value: "High", fill: "#a83232", fontSize: 10 }} />
          <Area yAxisId="wind" type="monotone" dataKey="Wind (km/h)" stroke="#d4a517" strokeWidth={2} fill="url(#gWind)" dot={{ fill: "#d4a517", r: 2.5 }} activeDot={{ r: 4 }} />
          <Area yAxisId="rain" type="monotone" dataKey="Rain Chance (%)" stroke="#4a7fb0" strokeWidth={2} fill="url(#gRain2)" dot={{ fill: "#4a7fb0", r: 2.5 }} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
