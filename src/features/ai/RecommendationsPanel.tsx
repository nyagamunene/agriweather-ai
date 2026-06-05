"use client";
import type { FarmingRecommendation } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

interface Props {
  recommendations: FarmingRecommendation[];
  cropName?: string;
}

const priorityStyles = {
  urgent: "border-red-500/50 bg-red-950/25",
  high: "border-orange-500/50 bg-orange-950/25",
  medium: "border-yellow-500/50 bg-yellow-950/25",
  low: "border-emerald-500/50 bg-emerald-950/25",
};

const priorityBadge = {
  urgent: "text-red-300 bg-red-950/60 border border-red-700/40",
  high: "text-orange-300 bg-orange-950/60 border border-orange-700/40",
  medium: "text-yellow-300 bg-yellow-950/60 border border-yellow-700/40",
  low: "text-emerald-300 bg-emerald-950/60 border border-emerald-700/40",
};

export function RecommendationsPanel({ recommendations, cropName }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
          AI Recommendations{cropName ? ` · ${cropName}` : ""}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <span className="text-4xl">🌿</span>
          <p className="text-slate-400 text-sm font-medium">Select a crop to get recommendations</p>
          <p className="text-slate-600 text-xs text-center">Irrigation, fertilizer, planting and pest management advice will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec, i) => (
            <div key={i} className={cn("rounded-xl border p-4 transition-all", priorityStyles[rec.priority])}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{rec.icon}</span>
                  <p className="text-slate-200 text-sm font-semibold">{rec.title}</p>
                </div>
                <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-semibold capitalize shrink-0", priorityBadge[rec.priority])}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed pl-8">{rec.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
