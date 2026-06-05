"use client";
import { CROPS } from "./data";
import type { CropProfile } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

interface Props {
  selected: CropProfile | null;
  onChange: (crop: CropProfile) => void;
}

export function CropSelector({ selected, onChange }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Select Crop</p>
      <div className="grid grid-cols-4 gap-2">
        {CROPS.map((crop) => (
          <button
            key={crop.id}
            onClick={() => onChange(crop)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
              selected?.id === crop.id
                ? "bg-emerald-900/40 border-emerald-500/60 text-emerald-300"
                : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            )}
          >
            <span className="text-2xl">{crop.emoji}</span>
            <span className="text-xs font-medium">{crop.name}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-700/30">
          <p className="text-slate-300 text-sm font-medium">{selected.emoji} {selected.name}</p>
          <p className="text-slate-500 text-xs mt-1">{selected.description}</p>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span>🌡️ {selected.idealTemperature[0]}–{selected.idealTemperature[1]}°C</span>
            <span>💧 {selected.rainfallNeeds} rainfall</span>
            <span>💦 {selected.humidityRange[0]}–{selected.humidityRange[1]}% RH</span>
          </div>
        </div>
      )}
    </div>
  );
}
