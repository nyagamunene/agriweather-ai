"use client";
import { useState, useMemo } from "react";
import { CROPS, CROP_CATEGORIES } from "./data";
import type { CropProfile } from "@/types/crops";
import { cn } from "@/lib/utils/cn";

interface Props {
  selected: CropProfile | null;
  onChange: (crop: CropProfile) => void;
}

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
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
        Crop Selection
      </p>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-dim)" }}>⌕</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search crops..."
          className="w-full pl-8 pr-4 py-2 text-sm"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-soft)",
            borderRadius: "5px",
            color: "var(--text)",
            outline: "none",
          }}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {CROP_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              background: activeCategory === cat.id ? "var(--accent-glow)" : "var(--bg-raised)",
              color: activeCategory === cat.id ? "var(--accent)" : "var(--text-dim)",
              border: `1px solid ${activeCategory === cat.id ? "var(--accent-dim)" : "var(--border-soft)"}`,
              borderRadius: "4px",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto">
        {filtered.map(crop => {
          const isSelected = selected?.id === crop.id;
          return (
            <button
              key={crop.id}
              onClick={() => onChange(crop)}
              title={crop.name}
              className="flex flex-col items-center gap-1 py-2.5 px-1 transition-colors text-center"
              style={{
                background: isSelected ? "var(--accent-glow)" : "var(--bg-raised)",
                border: `1px solid ${isSelected ? "var(--accent-dim)" : "var(--border-soft)"}`,
                borderRadius: "5px",
              }}
            >
              <span className="text-xl leading-none">{crop.emoji}</span>
              <span
                className="text-xs font-medium leading-tight line-clamp-2"
                style={{ color: isSelected ? "var(--accent)" : "var(--text-muted)" }}
              >
                {crop.name}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-8 text-center py-6 text-xs" style={{ color: "var(--text-dim)" }}>
            No crops match your search
          </div>
        )}
      </div>

      {/* Selected crop detail */}
      {selected && (
        <div
          className="mt-3 p-3"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-2xl">{selected.emoji}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{selected.name}</p>
              <p className="text-xs capitalize" style={{ color: "var(--text-dim)" }}>
                {selected.category.replace("_", " ")}
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{selected.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <InfoBlock label="Ideal Temp" value={`${selected.idealTemperature[0]}–${selected.idealTemperature[1]}°C`} />
            <InfoBlock label="Rainfall" value={selected.rainfallNeeds} />
            <InfoBlock label="Humidity" value={`${selected.humidityRange[0]}–${selected.humidityRange[1]}%`} />
            <InfoBlock label="Season" value={selected.growingSeasons[0]} />
          </div>
          {selected.sensitivity.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.sensitivity.map(s => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5"
                  style={{
                    background: "rgba(168,50,50,0.12)",
                    color: "var(--risk-high)",
                    border: "1px solid rgba(168,50,50,0.25)",
                    borderRadius: "3px",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-2"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", borderRadius: "4px" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
      <p className="font-medium capitalize" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}
