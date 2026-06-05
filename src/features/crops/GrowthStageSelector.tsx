"use client";
import { Sprout, Leaf, Flower2, Apple, Wheat } from "lucide-react";
import { GROWTH_STAGES } from "@/types/crops";
import type { GrowthStage } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

const STAGE_ICONS: Record<GrowthStage, typeof Sprout> = {
  planting: Sprout,
  vegetative: Leaf,
  flowering: Flower2,
  fruiting: Apple,
  harvest: Wheat,
};

interface Props {
  value: GrowthStage | null;
  onChange: (stage: GrowthStage) => void;
}

export function GrowthStageSelector({ value, onChange }: Props) {
  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
        Growth Stage
      </p>

      <div className="flex items-center gap-0">
        {GROWTH_STAGES.map((stage, idx) => {
          const Icon = STAGE_ICONS[stage.id];
          const isSelected = value === stage.id;
          const isPast = value && GROWTH_STAGES.findIndex(s => s.id === value) > idx;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <button
                onClick={() => onChange(stage.id)}
                title={stage.description}
                className="flex flex-col items-center gap-1.5 py-2 px-1 transition-colors flex-1 min-w-0 group"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isSelected && "ring-2",
                  )}
                  style={{
                    background: isSelected ? "var(--accent-glow)" : isPast ? "var(--bg-raised)" : "var(--bg-raised)",
                    borderColor: isSelected ? "var(--accent-dim)" : "var(--border-soft)",
                    borderWidth: "1px",
                    ...(isSelected ? { "--tw-ring-color": "var(--accent)" } as React.CSSProperties : {}),
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color: isSelected ? "var(--accent)" : isPast ? "var(--text-muted)" : "var(--text-dim)",
                      opacity: isPast && !isSelected ? 0.5 : 1,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium text-center leading-tight"
                  style={{
                    color: isSelected ? "var(--accent)" : isPast ? "var(--text-muted)" : "var(--text-dim)",
                  }}
                >
                  {stage.label}
                </span>
              </button>

              {idx < GROWTH_STAGES.length - 1 && (
                <div
                  className="w-6 h-px shrink-0 mx-0.5"
                  style={{
                    background: (isPast || (value === stage.id)) ? "var(--accent-dim)" : "var(--border-soft)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {value && (
        <p className="mt-2.5 text-xs text-center" style={{ color: "var(--text-muted)" }}>
          {GROWTH_STAGES.find(s => s.id === value)?.description}
        </p>
      )}
    </div>
  );
}
