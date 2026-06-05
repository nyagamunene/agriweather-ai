"use client";
import { useState, useRef } from "react";
import { MapPicker } from "@/components/MapPicker";

interface TreeResult {
  analysis_id: string;
  total_tree_count: number;
  tree_density_per_acre?: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: { healthy: number; needs_care: number; needs_replacement: number };
  tree_species_guess?: string;
  observations: string[];
  recommendations: string[];
  overlay_image_url?: string;
  original_image_url?: string;
  low_confidence: boolean;
  county?: string;
  land_acres?: number;
}

interface Props {
  quota?: { used: number; limit: number; remaining: number };
}

export function TreeAnalysis({ quota }: Props) {
  const [result, setResult] = useState<TreeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [county, setCounty] = useState("");
  const [landAcres, setLandAcres] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      if (county) form.append("county", county);
      if (landAcres) form.append("landAcres", landAcres);

      const res = await fetch("/api/trees", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const confidencePct = result ? Math.round(result.confidence_score * 100) : 0;
  const quotaPct = quota ? (quota.remaining / quota.limit) * 100 : 100;

  return (
    <div
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
      className="p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Plot Health Analysis
        </span>
        {quota && (
          <div className="flex items-center gap-2.5 text-xs" style={{ color: "var(--text-dim)" }}>
            <div
              className="w-14 h-1 rounded-full overflow-hidden"
              style={{ background: "var(--bg-raised)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${quotaPct}%`, background: quotaPct > 30 ? "var(--risk-low)" : "var(--risk-high)" }}
              />
            </div>
            {quota.remaining}/{quota.limit} remaining
          </div>
        )}
      </div>

      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Upload a drone or aerial image. The CV engine counts tree crowns, assesses canopy health, and generates agronomic recommendations. 5 analyses/month on free tier.
      </p>

      {/* Map boundary selector */}
      <button
        onClick={() => setMapOpen(true)}
        className="w-full mb-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-soft)",
          borderRadius: "5px",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
        Select on map
      </button>

      <MapPicker
        mode="boundary"
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(result) => {
          if ("acres" in result) {
            setLandAcres(String(result.acres));
          }
        }}
      />

      {/* Upload zone */}
      <div
        className="border-dashed border-2 p-6 text-center cursor-pointer transition-colors mb-3"
        style={{
          borderColor: preview ? "var(--accent-dim)" : "var(--border)",
          background: preview ? "var(--accent-glow)" : "var(--bg-raised)",
          borderRadius: "6px",
        }}
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => e.preventDefault()}
        onMouseEnter={e => { if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "var(--text-dim)"; }}
        onMouseLeave={e => { if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {preview ? (
          <div>
            <img src={preview} alt="Farm preview" className="max-h-44 mx-auto rounded object-cover mb-2" />
            <p className="text-xs" style={{ color: "var(--accent)" }}>✓ {file?.name} · Click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-2xl mb-2 select-none">⊕</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Drop farm image or click to browse
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>JPEG · PNG · WEBP · max 20 MB</p>
          </div>
        )}
      </div>

      {/* Optional metadata */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-dim)" }}>County / Region</label>
          <input
            type="text"
            value={county}
            onChange={e => setCounty(e.target.value)}
            placeholder="e.g. Bomet"
            className="w-full px-3 py-2 text-sm"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-soft)",
              borderRadius: "5px",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-dim)" }}>Plot size (acres)</label>
          <input
            type="number"
            value={landAcres}
            onChange={e => setLandAcres(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full px-3 py-2 text-sm"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-soft)",
              borderRadius: "5px",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        style={{
          background: !file || loading ? "var(--bg-raised)" : "var(--accent)",
          color: !file || loading ? "var(--text-dim)" : "#0f0e0b",
          borderRadius: "5px",
          cursor: !file || loading ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing canopy...
          </>
        ) : "Analyze Farm Image"}
      </button>

      {error && (
        <div
          className="mt-3 px-3 py-2.5 text-sm"
          style={{
            background: "rgba(168,50,50,0.12)",
            border: "1px solid rgba(168,50,50,0.35)",
            borderRadius: "5px",
            color: "var(--risk-crit)",
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Image comparison */}
          {(result.original_image_url || result.overlay_image_url) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => setShowOverlay(false)}
                  className="text-xs px-2.5 py-1"
                  style={{
                    background: !showOverlay ? "var(--bg-hover)" : "transparent",
                    color: !showOverlay ? "var(--text)" : "var(--text-dim)",
                    border: `1px solid ${!showOverlay ? "var(--border)" : "transparent"}`,
                    borderRadius: "4px",
                  }}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowOverlay(true)}
                  className="text-xs px-2.5 py-1"
                  style={{
                    background: showOverlay ? "var(--accent-glow)" : "transparent",
                    color: showOverlay ? "var(--accent)" : "var(--text-dim)",
                    border: `1px solid ${showOverlay ? "var(--accent-dim)" : "transparent"}`,
                    borderRadius: "4px",
                  }}
                >
                  Annotated
                </button>
              </div>
              <img
                src={showOverlay ? (result.overlay_image_url ?? result.original_image_url) : result.original_image_url}
                alt={showOverlay ? "Annotated" : "Original"}
                className="w-full rounded object-cover max-h-52"
                style={{ border: "1px solid var(--border-soft)" }}
              />
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ResultStat label="Trees" value={String(result.total_tree_count)} accent />
            <ResultStat label="Canopy" value={`${result.canopy_coverage_pct.toFixed(1)}%`} />
            <ResultStat label="Confidence" value={`${confidencePct}%`} />
            {result.tree_density_per_acre && <ResultStat label="Trees/Acre" value={result.tree_density_per_acre.toFixed(1)} />}
          </div>

          {/* Health */}
          <div
            className="p-3"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
              Tree Health
            </p>
            <div className="space-y-2.5">
              <HealthBar label="Healthy" count={result.tree_health.healthy} total={result.total_tree_count} color="var(--risk-low)" />
              <HealthBar label="Needs Care" count={result.tree_health.needs_care} total={result.total_tree_count} color="var(--risk-mod)" />
              <HealthBar label="Needs Replacement" count={result.tree_health.needs_replacement} total={result.total_tree_count} color="var(--risk-crit)" />
            </div>
            {result.tree_species_guess && (
              <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
                Species: <span style={{ color: "var(--text-muted)" }}>{result.tree_species_guess}</span>
              </p>
            )}
          </div>

          {/* Observations */}
          {result.observations?.length > 0 && (
            <div
              className="p-3"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-dim)" }}>Observations</p>
              <ul className="space-y-1.5">
                {result.observations.map((obs, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--text-dim)", flexShrink: 0 }}>–</span>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div
              className="p-3"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent-dim)", borderRadius: "6px" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--accent)" }}>Recommendations</p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="text-center py-3 px-2"
      style={{
        background: accent ? "var(--accent-glow)" : "var(--bg-raised)",
        border: `1px solid ${accent ? "var(--accent-dim)" : "var(--border-soft)"}`,
        borderRadius: "5px",
      }}
    >
      <p className="font-bold text-lg tabular-nums" style={{ color: accent ? "var(--accent)" : "var(--text)" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
    </div>
  );
}

function HealthBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-dim)" }}>{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
