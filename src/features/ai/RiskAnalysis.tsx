"use client";
import type { AgriculturalRisk } from "@/types/crops";

interface Props {
  risks: AgriculturalRisk;
}

const riskColors = {
  low: { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-950/60 text-emerald-300 border-emerald-700/40" },
  moderate: { bar: "bg-yellow-500", text: "text-yellow-400", badge: "bg-yellow-950/60 text-yellow-300 border-yellow-700/40" },
  high: { bar: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-950/60 text-orange-300 border-orange-700/40" },
  critical: { bar: "bg-red-500", text: "text-red-400", badge: "bg-red-950/60 text-red-300 border-red-700/40" },
};

const riskLabels: Record<keyof AgriculturalRisk, { label: string; icon: string }> = {
  drought: { label: "Drought Risk", icon: "🏜️" },
  flood: { label: "Flood Risk", icon: "🌊" },
  heatStress: { label: "Heat Stress", icon: "🌡️" },
  frostRisk: { label: "Frost Risk", icon: "🧊" },
  diseaseRisk: { label: "Disease Risk", icon: "🦠" },
};

export function RiskAnalysis({ risks }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span>⚠️</span>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Agricultural Risk Analysis</p>
      </div>

      <div className="flex flex-col gap-4">
        {(Object.keys(risks) as Array<keyof AgriculturalRisk>).map((key) => {
          const risk = risks[key];
          const meta = riskLabels[key];
          const colors = riskColors[risk.level];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-slate-300 text-sm">{meta.label}</span>
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 border font-medium ${colors.badge}`}>
                  {risk.label}
                </span>
              </div>
              <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${risk.score}%` }}
                />
              </div>
              <p className="text-slate-600 text-xs mt-1">{risk.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
