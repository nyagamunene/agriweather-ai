"use client";
import { useState, useMemo } from "react";
import { CROPS, CROP_CATEGORIES } from "./data";
import type { CropProfile } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

interface Props {
  selected: CropProfile | null;
  onChange: (crop: CropProfile) => void;
}

const rainfallColor = {
  low: "text-yellow-400",
  moderate: "text-cyan-400",
  high: "text-blue-400",
};

export function CropSelector({ selected, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byCat = activeCategory === "all" ? CROPS : CROPS.filter(c => c.category === activeCategory);
    if (!search.trim()) return byCat;
    const q = search.toLowerCase();
    return byCat.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [activeCategory, search]);

  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Select Crop</p>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search crops..."
          className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2 text-slate-300 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-600/50 transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CROP_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all border",
              activeCategory === cat.id
                ? "bg-emerald-900/50 text-emerald-300 border-emerald-700/50"
                : "bg-slate-800/40 text-slate-500 border-slate-700/30 hover:text-slate-300"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
        {filtered.map(crop => (
          <button
            key={crop.id}
            onClick={() => onChange(crop)}
            title={crop.name}
            className={cn(
              "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center",
              selected?.id === crop.id
                ? "bg-emerald-900/40 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-900/20"
                : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            )}
          >
            <span className="text-xl">{crop.emoji}</span>
            <span className="text-xs font-medium leading-tight line-clamp-2">{crop.name}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-8 text-center py-6 text-slate-600 text-sm">No crops match your search</div>
        )}
      </div>

      {/* Selected crop detail */}
      {selected && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selected.emoji}</span>
            <div>
              <p className="text-slate-200 font-semibold text-sm">{selected.name}</p>
              <p className="text-slate-500 text-xs capitalize">{selected.category.replace("_", " ")}</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-3">{selected.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-slate-600 mb-0.5">🌡️ Ideal Temp</p>
              <p className="text-slate-300 font-medium">{selected.idealTemperature[0]}–{selected.idealTemperature[1]}°C</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-slate-600 mb-0.5">💧 Rainfall</p>
              <p className={cn("font-medium capitalize", rainfallColor[selected.rainfallNeeds])}>{selected.rainfallNeeds}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-slate-600 mb-0.5">💦 Humidity</p>
              <p className="text-slate-300 font-medium">{selected.humidityRange[0]}–{selected.humidityRange[1]}%</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-slate-600 mb-0.5">📅 Season</p>
              <p className="text-slate-300 font-medium truncate">{selected.growingSeasons[0]}</p>
            </div>
          </div>
          {selected.sensitivity.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.sensitivity.map(s => (
                <span key={s} className="text-xs bg-red-950/40 text-red-400 border border-red-800/30 rounded-full px-2 py-0.5">⚠ {s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
