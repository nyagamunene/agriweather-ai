"use client";
import { useEffect, useState, useCallback } from "react";
import type { GeocodingResult } from "@/types/weather";
import type { CropProfile } from "@/types/crops";

interface PlotRow {
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
  currentLocation: GeocodingResult;
  currentCrop: CropProfile | null;
  onLoad: (loc: GeocodingResult, cropId: string | null) => void;
}

export function FarmProfiles({ currentLocation, currentCrop, onLoad }: Props) {
  const [plots, setPlots] = useState<PlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPlots = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch("/api/plots", { signal: controller.signal });
      if (res.ok) {
        const { plots: data } = await res.json();
        setPlots(data ?? []);
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
    const timeout = window.setTimeout(() => {
      void fetchPlots();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchPlots]);

  async function handleSave() {
    if (!formName.trim()) { setSaveError("Plot name is required"); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          lat: currentLocation.lat,
          lon: currentLocation.lon,
          crop_id: currentCrop?.id ?? null,
          county: currentLocation.state ?? null,
          notes: formNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.error ?? "Failed to save");
        return;
      }
      setFormName("");
      setFormNotes("");
      setShowSaveForm(false);
      await fetchPlots();
    } catch {
      setSaveError("Failed to save farm profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/plots?id=${id}`, { method: "DELETE" });
      setPlots(p => p.filter(pl => pl.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function handleLoad(plot: PlotRow) {
    onLoad(
      { name: plot.name, lat: plot.lat, lon: plot.lon, country: "", state: plot.county ?? undefined },
      plot.crop_id,
    );
  }

  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Saved Farm Profiles
        </span>
        <button
          onClick={() => { setShowSaveForm(v => !v); setSaveError(null); }}
          className="text-xs px-2.5 py-1 font-medium transition-colors"
          style={{
            background: showSaveForm ? "var(--accent-glow)" : "var(--bg-raised)",
            border: `1px solid ${showSaveForm ? "var(--accent-dim)" : "var(--border-soft)"}`,
            color: showSaveForm ? "var(--accent)" : "var(--text-muted)",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showSaveForm ? "Cancel" : "+ Save current"}
        </button>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div
          className="mb-4 p-3 space-y-2.5"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}
        >
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-dim)" }}>
              Saving: <span style={{ color: "var(--text-muted)" }}>{currentLocation.name.split(",")[0]}</span>
              {currentCrop && <span> · {currentCrop.emoji} {currentCrop.name}</span>}
            </p>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-dim)" }}>Farm name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Kiambu Maize Plot"
              autoFocus
              className="w-full px-3 py-2 text-sm"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: "5px",
                color: "var(--text)",
                outline: "none",
              }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-dim)" }}>Notes (optional)</label>
            <input
              type="text"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="e.g. Irrigated, 2 acres near river"
              className="w-full px-3 py-2 text-sm"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: "5px",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>
          {saveError && (
            <p className="text-xs" style={{ color: "var(--risk-crit)" }}>{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 text-sm font-semibold transition-colors"
            style={{
              background: saving ? "var(--bg-hover)" : "var(--accent)",
              color: saving ? "var(--text-dim)" : "#0f0e0b",
              borderRadius: "5px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Farm Profile"}
          </button>
        </div>
      )}

      {/* Plots list */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>Loading...</span>
        </div>
      ) : loadError ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <span className="text-2xl" style={{ color: "var(--text-dim)" }}>!</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{loadError}</p>
        </div>
      ) : plots.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <span className="text-2xl" style={{ color: "var(--text-dim)" }}>⊕</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>No saved farms yet</p>
          <p className="text-xs text-center max-w-48" style={{ color: "var(--text-dim)" }}>
            Select a location and crop, then click &quot;+ Save current&quot; to save a farm profile
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plots.map(plot => (
            <div
              key={plot.id}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-soft)",
                borderRadius: "6px",
              }}
            >
              {/* Crop emoji or pin */}
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0 text-base"
                style={{ background: "var(--bg-hover)", borderRadius: "5px" }}
              >
                {plot.crop_emoji ?? "📍"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{plot.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                  {[plot.crop_name, plot.county, plot.area_acres ? `${plot.area_acres} ac` : null]
                    .filter(Boolean).join(" · ")}
                  {!plot.crop_name && !plot.county && (
                    <span className="tabular-nums">{plot.lat.toFixed(3)}, {plot.lon.toFixed(3)}</span>
                  )}
                </p>
                {plot.notes && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
                    {plot.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleLoad(plot)}
                  className="text-xs px-2 py-1 font-medium transition-colors"
                  style={{
                    background: "var(--accent-glow)",
                    border: "1px solid var(--accent-dim)",
                    color: "var(--accent)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  title="Load this farm"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDelete(plot.id)}
                  disabled={deletingId === plot.id}
                  className="text-xs px-2 py-1 transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-soft)",
                    color: deletingId === plot.id ? "var(--text-dim)" : "var(--risk-crit)",
                    borderRadius: "4px",
                    cursor: deletingId === plot.id ? "not-allowed" : "pointer",
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
