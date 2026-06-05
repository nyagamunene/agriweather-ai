"use client";
import { useEffect, useState, useCallback } from "react";
import type { GeocodingResult } from "@/types/weather";

interface LocationRecord {
  name: string;
  lat: number;
  lon: number;
  country: string;
  timezone: string | null;
  created_at: string;
}

interface TreeRecord {
  analysis_id: string;
  county?: string;
  land_acres?: number;
  total_tree_count?: number;
  tree_density_per_acre?: number;
  confidence_score?: number;
  canopy_coverage_pct?: number;
  health_healthy?: number;
  health_needs_care?: number;
  health_needs_replacement?: number;
  tree_species_guess?: string;
  low_confidence?: boolean;
  observations?: string[];
  recommendations?: string[];
  original_image_url?: string;
  overlay_image_url?: string;
  analyzed_at?: string;
}

interface HistoryData {
  locations: LocationRecord[];
  treeAnalyses: TreeRecord[];
}

interface Props {
  onLocationSelect: (loc: GeocodingResult) => void;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HistoryPanel({ onLocationSelect }: Props) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTree, setExpandedTree] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch("/api/history", { signal: controller.signal });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("History is temporarily unavailable");
      }
    } catch {
      setError("History is taking too long to load");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchHistory();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchHistory]);

  return (
    <div className="space-y-4">
      {/* Section A: Recent Locations */}
      <div
        style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
        className="p-4"
      >
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Recent Locations
        </span>

        {loading ? (
          <div className="py-8 flex justify-center">
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>Loading...</span>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <span className="text-2xl font-mono" style={{ color: "var(--text-dim)" }}>!</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : !data || data.locations.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <span className="text-2xl font-mono" style={{ color: "var(--text-dim)" }}>◎</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No locations yet</p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Search for a location to see it here</p>
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {data.locations.map((loc, i) => (
              <button
                key={i}
                onClick={() => {
                  onLocationSelect({
                    name: loc.name,
                    lat: Number(loc.lat),
                    lon: Number(loc.lon),
                    country: loc.country ?? "",
                    state: undefined,
                  });
                }}
                className="w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between"
                style={{
                  borderBottom: i < data.locations.length - 1 ? "1px solid var(--border-soft)" : "none",
                  borderRadius: "4px",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {loc.name.split(",").slice(0, 2).join(",")}
                  </p>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--text-dim)" }}>
                    {Number(loc.lat).toFixed(4)}, {Number(loc.lon).toFixed(4)}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-dim)" }}>
                  {relativeTime(loc.created_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section B: Tree Analysis History */}
      <div
        style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
        className="p-4"
      >
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
          Tree Analysis History
        </span>

        {loading ? (
          <div className="py-8 flex justify-center">
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>Loading...</span>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <span className="text-2xl font-mono" style={{ color: "var(--text-dim)" }}>!</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : !data || data.treeAnalyses.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <span className="text-2xl font-mono" style={{ color: "var(--text-dim)" }}>🌳</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No tree analyses yet</p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Upload an image in Tree Analysis to see results here</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {data.treeAnalyses.map((tree, i) => {
              const isExpanded = expandedTree === tree.analysis_id;
              const confPct = tree.confidence_score ? Math.round(tree.confidence_score * 100) : 0;
              const totalTrees = tree.total_tree_count ?? 0;

              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--border-soft)",
                    background: "var(--bg-raised)",
                    borderRadius: "6px",
                  }}
                >
                  <button
                    onClick={() => setExpandedTree(isExpanded ? null : tree.analysis_id ?? null)}
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {tree.original_image_url && (
                        <img
                          src={tree.original_image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                          style={{ border: "1px solid var(--border-soft)" }}
                        />
                      )}
                      <div>
                        <p className="text-sm" style={{ color: "var(--text)" }}>
                          {totalTrees} trees · {tree.canopy_coverage_pct?.toFixed(1)}% canopy · {confPct}% confidence
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                          {tree.county ? `${tree.county} · ` : ""}
                          {tree.analyzed_at ? relativeTime(tree.analyzed_at) : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      className="px-3 pb-3 space-y-3"
                      style={{ borderTop: "1px solid var(--border-soft)" }}
                    >
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-3">
                        <Stat label="Trees" value={String(totalTrees)} />
                        <Stat label="Canopy" value={`${tree.canopy_coverage_pct?.toFixed(1) ?? "—"}%`} />
                        <Stat label="Confidence" value={`${confPct}%`} />
                        {tree.tree_density_per_acre && (
                          <Stat label="Trees/Acre" value={tree.tree_density_per_acre.toFixed(1)} />
                        )}
                        {tree.land_acres && (
                          <Stat label="Acres" value={String(tree.land_acres)} />
                        )}
                        {tree.tree_species_guess && (
                          <Stat label="Species" value={tree.tree_species_guess} />
                        )}
                      </div>

                      {/* Health */}
                      {tree.health_healthy !== undefined && (
                        <div
                          className="p-2.5"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-soft)", borderRadius: "5px" }}
                        >
                          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-dim)" }}>Tree Health</p>
                          <div className="space-y-2">
                            <HealthRow label="Healthy" count={tree.health_healthy} total={totalTrees} color="var(--risk-low)" />
                            <HealthRow label="Needs Care" count={tree.health_needs_care ?? 0} total={totalTrees} color="var(--risk-mod)" />
                            <HealthRow label="Needs Replacement" count={tree.health_needs_replacement ?? 0} total={totalTrees} color="var(--risk-crit)" />
                          </div>
                        </div>
                      )}

                      {/* Observations */}
                      {tree.observations && tree.observations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-dim)" }}>Observations</p>
                          <ul className="space-y-1">
                            {tree.observations.map((obs, j) => (
                              <li key={j} className="text-xs flex gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <span style={{ color: "var(--text-dim)" }}>–</span> {obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {tree.recommendations && tree.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--accent)" }}>Recommendations</p>
                          <ul className="space-y-1">
                            {tree.recommendations.map((rec, j) => (
                              <li key={j} className="text-xs flex gap-1.5" style={{ color: "var(--text)" }}>
                                <span style={{ color: "var(--accent)" }}>→</span> {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="text-center py-2 px-1"
      style={{
        border: "1px solid var(--border-soft)",
        background: "var(--bg-surface)",
        borderRadius: "4px",
      }}
    >
      <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
    </div>
  );
}

function HealthRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-dim)" }}>{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
