"use client";
import { Loader2 } from "lucide-react";
import type { FarmingRecommendation } from "@/types/crops";

interface Props {
  recommendations: FarmingRecommendation[];
  cropName?: string;
  loading?: boolean;
  error?: boolean;
}

const priorityMeta = {
  urgent: { color: "var(--risk-crit)", bg: "rgba(168,50,50,0.1)", border: "rgba(168,50,50,0.3)", code: "URG" },
  high:   { color: "var(--risk-high)", bg: "rgba(196,98,58,0.1)", border: "rgba(196,98,58,0.3)", code: "HI" },
  medium: { color: "var(--risk-mod)",  bg: "rgba(184,134,11,0.1)", border: "rgba(184,134,11,0.3)", code: "MED" },
  low:    { color: "var(--risk-low)",  bg: "rgba(74,140,92,0.1)", border: "rgba(74,140,92,0.3)", code: "LO" },
};

export function RecommendationsPanel({ recommendations, cropName, loading, error }: Props) {
  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Recommendations
        </span>
        {cropName && (
          <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>{cropName}</span>
        )}
      </div>

      {!cropName ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <span className="text-3xl font-mono" style={{ color: "var(--text-dim)" }}>◌</span>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Select a crop to get recommendations</p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Irrigation, fertilizer, planting and pest management advice</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Generating recommendations...</p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Analyzing weather patterns for {cropName}</p>
        </div>
      ) : error || recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <span className="text-3xl font-mono" style={{ color: "var(--text-dim)" }}>⚠</span>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No recommendations available</p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Unable to generate advice for {cropName}. Check that GEMINI_API_KEY is configured or try another crop.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => {
            const meta = priorityMeta[rec.priority];
            return (
              <div
                key={i}
                className="p-3"
                style={{
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  borderRadius: "5px",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{rec.icon}</span>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{rec.title}</p>
                  </div>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 shrink-0"
                    style={{ color: meta.color, border: `1px solid ${meta.border}`, borderRadius: "2px", background: "transparent" }}
                  >
                    {meta.code}
                  </span>
                </div>
                <p className="text-xs leading-relaxed pl-7" style={{ color: "var(--text-muted)" }}>
                  {rec.detail}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
