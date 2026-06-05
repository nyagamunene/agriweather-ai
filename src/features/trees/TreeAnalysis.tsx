"use client";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils/cn";

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

  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌳</span>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Tree & Canopy Analysis</p>
        </div>
        {quota && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
              />
            </div>
            <span className="text-slate-500">{quota.remaining}/{quota.limit} left</span>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs mb-4 leading-relaxed">
        Upload a drone, aerial, or satellite image of a farm plot. Our CV engine counts tree crowns, assesses canopy health, and generates agronomic recommendations.
      </p>

      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4",
          preview ? "border-emerald-700/50 bg-emerald-950/20" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/40"
        )}
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => e.preventDefault()}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Farm preview" className="max-h-48 mx-auto rounded-lg object-cover" />
            <p className="text-emerald-400 text-xs mt-2">✓ {file?.name} · Click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl mb-2">🛰️</p>
            <p className="text-slate-400 text-sm font-medium">Drop farm image here or click to browse</p>
            <p className="text-slate-600 text-xs mt-1">JPEG · PNG · WEBP · max 20 MB</p>
          </div>
        )}
      </div>

      {/* Optional metadata */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-slate-500 text-xs mb-1 block">County / Region (optional)</label>
          <input
            type="text"
            value={county}
            onChange={e => setCounty(e.target.value)}
            placeholder="e.g. Bomet"
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 text-slate-300 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-600/50 transition-all"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs mb-1 block">Plot size in acres (optional)</label>
          <input
            type="number"
            value={landAcres}
            onChange={e => setLandAcres(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 text-slate-300 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-600/50 transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing canopy...
          </>
        ) : "🔍 Analyze Farm Image"}
      </button>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-5 space-y-4">
          {/* Image comparison */}
          {(result.original_image_url || result.overlay_image_url) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setShowOverlay(false)} className={cn("text-xs px-3 py-1.5 rounded-lg transition-all", !showOverlay ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}>Original</button>
                <button onClick={() => setShowOverlay(true)} className={cn("text-xs px-3 py-1.5 rounded-lg transition-all", showOverlay ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50" : "text-slate-500 hover:text-slate-300")}>Annotated</button>
              </div>
              <img
                src={showOverlay ? (result.overlay_image_url ?? result.original_image_url) : result.original_image_url}
                alt={showOverlay ? "Annotated overlay" : "Original"}
                className="w-full rounded-xl object-cover max-h-56"
              />
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ResultStat icon="🌳" label="Total Trees" value={String(result.total_tree_count)} highlight />
            <ResultStat icon="📐" label="Canopy Cover" value={`${result.canopy_coverage_pct.toFixed(1)}%`} />
            <ResultStat icon="🎯" label="Confidence" value={`${confidencePct}%`} />
            {result.tree_density_per_acre && <ResultStat icon="🌿" label="Trees/Acre" value={result.tree_density_per_acre.toFixed(1)} />}
          </div>

          {/* Health breakdown */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Tree Health Breakdown</p>
            <div className="space-y-2.5">
              <HealthBar label="Healthy" count={result.tree_health.healthy} total={result.total_tree_count} color="bg-emerald-500" />
              <HealthBar label="Needs Care" count={result.tree_health.needs_care} total={result.total_tree_count} color="bg-yellow-500" />
              <HealthBar label="Needs Replacement" count={result.tree_health.needs_replacement} total={result.total_tree_count} color="bg-red-500" />
            </div>
            {result.tree_species_guess && (
              <p className="text-slate-500 text-xs mt-3">🌱 Species detected: <span className="text-slate-300">{result.tree_species_guess}</span></p>
            )}
          </div>

          {/* Observations */}
          {result.observations?.length > 0 && (
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">🔍 Observations</p>
              <ul className="space-y-1.5">
                {result.observations.map((obs, i) => (
                  <li key={i} className="text-slate-400 text-sm flex gap-2"><span className="text-slate-600 shrink-0">•</span>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-950/30 to-cyan-950/30 rounded-xl p-4 border border-emerald-800/30">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">🤖 AI Recommendations</p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2"><span className="text-emerald-600 shrink-0">→</span>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultStat({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3 border text-center", highlight ? "bg-emerald-950/30 border-emerald-700/40" : "bg-slate-900/60 border-slate-700/30")}>
      <p className="text-lg">{icon}</p>
      <p className={cn("font-bold text-xl", highlight ? "text-emerald-300" : "text-white")}>{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function HealthBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
