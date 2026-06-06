"use client";
import { useState, useRef, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import type { GeocodingResult } from "@/types/weather";
import { searchLocations } from "@/hooks/useWeather";
import { MapPicker } from "@/components/MapPicker";

interface Props {
  onSelect: (result: GeocodingResult) => void;
  isLoading?: boolean;
}

export function LocationSearch({ onSelect, isLoading }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const locs = await searchLocations(query);
      setResults(locs);
      setOpen(locs.length > 0);
      setSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(loc: GeocodingResult) {
    const short = loc.name.split(",").slice(0, 2).join(",");
    setQuery(short);
    setOpen(false);
    onSelect(loc);
  }

  function handleMapConfirm(result: { lat: number; lon: number; name: string } | { lat: number; lon: number; acres: number }) {
    if ("name" in result) {
      onSelect({
        name: result.name,
        lat: result.lat,
        lon: result.lon,
        country: "",
      });
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-dim)" }}
        >
          {searching || isLoading ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <Search size={14} />
          )}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          className="w-full pl-9 pr-10 py-1.5 text-sm"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            borderRadius: "5px",
            color: "var(--text)",
            outline: "none",
          }}
          onFocus={e => {
            (e.target as HTMLInputElement).style.borderColor = "var(--accent-dim)";
          }}
          onBlur={e => {
            (e.target as HTMLInputElement).style.borderColor = "var(--border)";
          }}
        />
        <button
          onClick={() => setMapOpen(true)}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1.5"
          style={{
            color: "var(--text-dim)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
          }}
        >
          <MapPin size={15} />
        </button>
      </div>

      <MapPicker
        mode="location"
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
      />

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1 w-full overflow-hidden z-50"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((loc, i) => (
            <button
              key={i}
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2.5 transition-colors"
              style={{
                borderBottom: i < results.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {loc.name.split(",").slice(0, 3).join(",")}
              </p>
              <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--text-dim)" }}>
                {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
