"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import * as Dialog from "@radix-ui/react-dialog";

const MapContent = dynamic(() => import("./MapContent"), { ssr: false, loading: () => <MapLoading /> });

interface LocationResult {
  lat: number;
  lon: number;
  name: string;
}

interface BoundaryResult {
  lat: number;
  lon: number;
  acres: number;
}

interface Props {
  mode: "location" | "boundary";
  open: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult | BoundaryResult) => void;
}

export function MapPicker({ mode, open, onClose, onConfirm }: Props) {
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLon, setPinLon] = useState<number | null>(null);
  const [pinName, setPinName] = useState<string>("");
  const [reverseLoading, setReverseLoading] = useState(false);

  const [boundaryPositions, setBoundaryPositions] = useState<[number, number][]>([]);
  const [acres, setAcres] = useState<number>(0);

  const handlePinChange = useCallback(async (lat: number, lon: number) => {
    setPinLat(lat);
    setPinLon(lon);
    setReverseLoading(true);
    try {
      const res = await fetch(`/api/geocode?reverse=1&lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setPinName(data.locations?.[0]?.name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } else {
        setPinName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch {
      setPinName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setReverseLoading(false);
    }
  }, []);

  const handleBoundaryChange = useCallback((positions: [number, number][], calculatedAcres: number) => {
    setBoundaryPositions(positions);
    setAcres(calculatedAcres);
  }, []);

  const handleConfirm = () => {
    if (mode === "location" && pinLat !== null && pinLon !== null) {
      onConfirm({ lat: pinLat, lon: pinLon, name: pinName });
    } else if (mode === "boundary" && boundaryPositions.length > 0) {
      const avgLat = boundaryPositions.reduce((s, p) => s + p[0], 0) / boundaryPositions.length;
      const avgLon = boundaryPositions.reduce((s, p) => s + p[1], 0) / boundaryPositions.length;
      onConfirm({ lat: avgLat, lon: avgLon, acres: Math.round(acres * 100) / 100 });
    }
    onClose();
  };

  const canConfirm =
    mode === "location" ? pinLat !== null && pinLon !== null && !reverseLoading : boundaryPositions.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90vw",
            maxWidth: "640px",
            maxHeight: "85vh",
            overflow: "auto",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            zIndex: 51,
            padding: "16px",
          }}
        >
          <Dialog.Title style={{ fontSize: 0, height: 0, overflow: "hidden" }}>
            {mode === "location" ? "Pick Location" : "Draw Plot Boundary"}
          </Dialog.Title>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
              {mode === "location" ? "Select Location" : "Draw Plot Boundary"}
            </span>
            <Dialog.Close asChild>
              <button
                className="text-xs px-2 py-1"
                style={{
                  color: "var(--text-dim)",
                  background: "transparent",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* Map */}
          <div style={{ border: "1px solid var(--border-soft)", borderRadius: "6px", overflow: "hidden" }}>
            <MapContent
              mode={mode}
              onPinChange={handlePinChange}
              onBoundaryChange={handleBoundaryChange}
            />
          </div>

          {/* Info bar */}
          <div
            className="mt-3 px-3 py-2 text-xs flex items-center gap-3"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-soft)",
              borderRadius: "5px",
            }}
          >
            {mode === "location" && (
              <>
                <span style={{ color: "var(--text-dim)" }}>Selected:</span>
                {pinLat !== null ? (
                  <span style={{ color: "var(--text)" }}>
                    {reverseLoading ? "Looking up..." : pinName}
                    {" "}
                    <span style={{ color: "var(--text-dim)" }}>({pinLat.toFixed(4)}, {pinLon?.toFixed(4)})</span>
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Click on the map to drop a pin</span>
                )}
              </>
            )}
            {mode === "boundary" && (
              <>
                <span style={{ color: "var(--text-dim)" }}>Area:</span>
                {acres > 0 ? (
                  <span style={{ color: "var(--text)" }}>
                    {acres.toFixed(2)} acres
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Draw a rectangle or polygon on the map</span>
                )}
              </>
            )}
          </div>

          {/* Confirm */}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={onClose}
              className="text-xs px-4 py-2"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-raised)",
                border: "1px solid var(--border-soft)",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="text-xs font-semibold px-4 py-2"
              style={{
                background: canConfirm ? "var(--accent)" : "var(--bg-raised)",
                color: canConfirm ? "#0f0e0b" : "var(--text-dim)",
                borderRadius: "5px",
                border: "none",
                cursor: canConfirm ? "pointer" : "not-allowed",
              }}
            >
              {mode === "location" ? "Confirm Location" : "Confirm Boundary"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MapLoading() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: "100%", height: "400px", background: "var(--bg-raised)", borderRadius: "6px" }}
    >
      <span className="text-xs" style={{ color: "var(--text-dim)" }}>Loading map...</span>
    </div>
  );
}
