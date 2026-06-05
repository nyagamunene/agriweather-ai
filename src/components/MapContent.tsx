"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix default marker icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function calculateAcres(positions: [number, number][]): number {
  const n = positions.length;
  if (n < 3) return 0;

  const R = 6378137;
  const avgLat = positions.reduce((s, p) => s + p[0], 0) / n;
  const avgLon = positions.reduce((s, p) => s + p[1], 0) / n;
  const φ0 = (avgLat * Math.PI) / 180;
  const cosφ = Math.cos(φ0);

  const pts = positions.map(([lat, lon]) => ({
    x: (lon - avgLon) * (Math.PI / 180) * R * cosφ,
    y: (lat - avgLat) * (Math.PI / 180) * R,
  }));

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }

  return Math.abs(area / 2) / 4046.86;
}

// ── Mode A: Click to pin ─────────────────────────────────────────────────
function LocationClickHandler({ onPin }: { onPin: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

// ── Mode B: Draw polygon ─────────────────────────────────────────────────
function DrawControl({ onDraw }: { onDraw: (positions: [number, number][]) => void }) {
  const map = useMap();
  const drawnRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (drawnRef.current) {
      map.removeLayer(drawnRef.current);
    }
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnRef.current = drawnItems;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Draw = (L.Control as any).Draw;
    const drawControl = new Draw({
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: "#d4a517", fillColor: "rgba(212,165,23,0.15)", weight: 2 },
        },
        rectangle: {
          shapeOptions: { color: "#d4a517", fillColor: "rgba(212,165,23,0.15)", weight: 2 },
        },
      },
      edit: { featureGroup: drawnItems },
    } as any);

    map.addControl(drawControl as L.Control);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreated = (e: any) => {
      drawnItems.addLayer(e.layer);
      const positions: [number, number][] = [];
      if (e.layer instanceof L.Polygon) {
        const latlngs = e.layer.getLatLngs();
        if (Array.isArray(latlngs) && Array.isArray(latlngs[0])) {
          for (const ll of latlngs[0] as L.LatLng[]) {
            positions.push([ll.lat, ll.lng]);
          }
        }
      }
      onDraw(positions);
    };
    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl as L.Control);
      map.removeLayer(drawnItems);
    };
  }, [map, onDraw]);

  return null;
}

// ── Main exported component ───────────────────────────────────────────────
interface MapContentProps {
  mode: "location" | "boundary";
  onPinChange?: (lat: number, lon: number) => void;
  onBoundaryChange?: (positions: [number, number][], acres: number) => void;
}

export default function MapContent({ mode, onPinChange, onBoundaryChange }: MapContentProps) {
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [polygonPositions, setPolygonPositions] = useState<[number, number][]>([]);

  const handlePin = useCallback(
    (lat: number, lon: number) => {
      setPin([lat, lon]);
      onPinChange?.(lat, lon);
    },
    [onPinChange],
  );

  const handleDraw = useCallback(
    (positions: [number, number][]) => {
      setPolygonPositions(positions);
      const acres = calculateAcres(positions);
      onBoundaryChange?.(positions, acres);
    },
    [onBoundaryChange],
  );

  const defaultCenter: [number, number] = [-1.2921, 36.8219]; // Nairobi

  return (
    <MapContainer
      center={defaultCenter}
      zoom={7}
      style={{ width: "100%", height: "400px", borderRadius: "6px" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {mode === "location" && (
        <>
          <LocationClickHandler onPin={handlePin} />
          {pin && <Marker position={pin} />}
          {pin && <MapRecenter lat={pin[0]} lon={pin[1]} />}
        </>
      )}

      {mode === "boundary" && (
        <>
          <DrawControl onDraw={handleDraw} />
          {polygonPositions.length > 0 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{ color: "#d4a517", fillColor: "rgba(212,165,23,0.15)", weight: 2 }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}
