"use client";
import type { FarmingRecommendation } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

interface Props {
  recommendations: FarmingRecommendation[];
  aiSummary?: string;
  cropName?: string;
}

const priorityStyles = {
  urgent: "border-red-500/60 bg-red-950/30",
  high: "border-orange-500/60 bg-orange-950/30",
  medium: "border-yellow-500/60 bg-yellow-950/30",
  low: "border-emerald-500/60 bg-emerald-950/30",
};

const priorityBadge = {
  urgent: "text-red-400 bg-red-950/60",
  high: "text-orange-400 bg-orange-950/60",
  medium: "text-yellow-400 bg-yellow-950/60",
  low: "text-emerald-400 bg-emerald-950/60",
};

export function RecommendationsPanel({ recommendations, aiSummary, cropName }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-emerald-400">🤖</span>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
          AI Recommendations {cropName ? `· ${cropName}` : ""}
        </p>
      </div>

      {aiSummary && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-700/30">
          <p className="text-slate-300 text-sm leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-2xl mb-2">🌿</p>
          <p className="text-sm">Select a crop to get personalized recommendations</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={cn("rounded-xl border p-4 transition-all", priorityStyles[rec.priority])}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{rec.icon}</span>
                  <p className="text-slate-200 text-sm font-medium">{rec.title}</p>
                </div>
                <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium capitalize shrink-0", priorityBadge[rec.priority])}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{rec.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
