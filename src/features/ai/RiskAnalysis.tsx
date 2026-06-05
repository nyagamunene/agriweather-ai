"use client";
import type { AgriculturalRisk } from "@/types/crops";

interface Props {
  risks: AgriculturalRisk;
}

const riskBar = {
  low: "var(--risk-low)",
  moderate: "var(--risk-mod)",
  high: "var(--risk-high)",
  critical: "var(--risk-crit)",
};

const riskLabel = {
  low: { bg: "rgba(74,140,92,0.15)", color: "var(--risk-low)", border: "rgba(74,140,92,0.3)" },
  moderate: { bg: "rgba(184,134,11,0.15)", color: "var(--risk-mod)", border: "rgba(184,134,11,0.3)" },
  high: { bg: "rgba(196,98,58,0.15)", color: "var(--risk-high)", border: "rgba(196,98,58,0.3)" },
  critical: { bg: "rgba(168,50,50,0.15)", color: "var(--risk-crit)", border: "rgba(168,50,50,0.3)" },
};

const riskMeta: Record<keyof AgriculturalRisk, { label: string; code: string }> = {
  drought: { label: "Drought", code: "DRT" },
  flood: { label: "Flood", code: "FLD" },
  heatStress: { label: "Heat Stress", code: "HT" },
  frostRisk: { label: "Frost", code: "FRS" },
  diseaseRisk: { label: "Disease", code: "DSE" },
};

export function RiskAnalysis({ risks }: Props) {
  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Risk Analysis
        </span>
      </div>

      <div className="space-y-3.5">
        {(Object.keys(risks) as Array<keyof AgriculturalRisk>).map((key) => {
          const risk = risks[key];
          const meta = riskMeta[key];
          const colors = riskLabel[risk.level];
          const barColor = riskBar[risk.level];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono px-1 py-0.5"
                    style={{ background: "var(--bg-raised)", color: "var(--text-dim)", border: "1px solid var(--border-soft)", borderRadius: "2px", minWidth: "32px", textAlign: "center" }}
                  >
                    {meta.code}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text)" }}>{meta.label}</span>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5"
                  style={{
                    background: colors.bg,
                    color: colors.color,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {risk.label}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${risk.score}%`, background: barColor }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{risk.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
