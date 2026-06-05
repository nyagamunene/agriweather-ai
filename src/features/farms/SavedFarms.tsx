"use client";
import { useState, useEffect, useCallback } from "react";
import { Home, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FarmEntry {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area_acres: number | null;
  crop_id: string | null;
  crop_name: string | null;
  crop_emoji: string | null;
  county: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  locationName?: string;
  locationLat?: number;
  locationLon?: number;
  selectedCropId?: string | null;
  county?: string;
  onLoadFarm: (lat: number, lon: number, name: string, cropId: string | null) => void;
}

export function SavedFarms({ locationName, locationLat, locationLon, selectedCropId, county, onLoadFarm }: Props) {
  const [farms, setFarms] = useState<FarmEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFarms = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch("/api/plots", { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.plots ?? []);
      } else {
        setLoadError("Saved farms are temporarily unavailable");
      }
    } catch {
      setLoadError("Saved farms are taking too long to load");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      void fetchFarms();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, fetchFarms]);

  const handleSave = async () => {
    if (!locationLat || !locationLon || !farmName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: farmName.trim(),
          lat: locationLat,
          lon: locationLon,
          crop_id: selectedCropId ?? null,
          county: county ?? null,
        }),
      });
      if (res.ok) {
        setFarmName("");
        setSaveOpen(false);
        await fetchFarms();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/plots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setFarms(prev => prev.filter(f => f.id !== id));
      }
    } catch { /* degrade */ }
  };

  const handleLoad = (farm: FarmEntry) => {
    onLoadFarm(farm.lat, farm.lon, farm.name, farm.crop_id ?? null);
    setOpen(false);
  };

  const canSave = locationLat != null && locationLon != null;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors",
        )}
        style={{
          background: open ? "var(--bg-raised)" : "transparent",
          color: open ? "var(--text)" : "var(--text-muted)",
          border: "1px solid var(--border-soft)",
          borderRadius: "5px",
        }}
      >
        <Home size={13} />
        <span className="hidden sm:inline">Farms</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto z-50"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
                Saved Farms
              </span>
              {canSave && (
                <button
                  onClick={() => { setSaveOpen(true); setFarmName(locationName?.split(",")[0] ?? ""); }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors"
                  style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-dim)",
                    borderRadius: "4px",
                  }}
                >
                  <Plus size={11} />
                  Save
                </button>
              )}
            </div>

            {/* Save dialog inline */}
            {saveOpen && (
              <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--bg-raised)" }}>
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaveOpen(false); }}
                  placeholder="Farm name..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "4px",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !farmName.trim()}
                    className="px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      background: saving ? "var(--bg-surface)" : "var(--accent)",
                      color: saving ? "var(--text-muted)" : "#0f0e0b",
                      borderRadius: "4px",
                      opacity: saving || !farmName.trim() ? 0.5 : 1,
                      cursor: saving || !farmName.trim() ? "default" : "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setSaveOpen(false)}
                    className="px-3 py-1 text-xs"
                    style={{ color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Farm list */}
            {loading ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>Loading farms...</p>
              </div>
            ) : loadError ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{loadError}</p>
              </div>
            ) : farms.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {canSave ? "Search a location then tap Save to add a farm." : "No saved farms yet. Set a location first."}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {farms.map(farm => (
                  <div
                    key={farm.id}
                    className="flex items-center justify-between px-3 py-2 group transition-colors"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-raised)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => handleLoad(farm)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                          {farm.name}
                        </span>
                        {farm.crop_emoji && (
                          <span className="text-xs shrink-0">{farm.crop_emoji}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {farm.county && (
                          <span className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
                            {farm.county}
                          </span>
                        )}
                        {farm.crop_name && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {farm.crop_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(farm.id); }}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-dim)", cursor: "pointer", background: "transparent", border: "none" }}
                      title="Delete farm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
