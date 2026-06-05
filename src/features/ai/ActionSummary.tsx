"use client";
import type { WeatherResponse } from "@/types/weather";
import type { CropProfile, AgriculturalRisk } from "@/types/crops";

interface Props {
  weather: WeatherResponse;
  selectedCrop: CropProfile | null;
  risks: AgriculturalRisk | null;
}

interface ActionStatus {
  primary: string;
  timeWindow: string;
  actions: string[];
  confidence: string;
  severity: "safe" | "watch" | "act" | "urgent";
}

function deriveActionStatus(weather: WeatherResponse, crop: CropProfile | null, risks: AgriculturalRisk | null): ActionStatus {
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  let worstRisk = "low";
  if (risks) {
    const levels: string[] = [risks.drought.level, risks.flood.level, risks.heatStress.level, risks.frostRisk.level, risks.diseaseRisk.level];
    const order = ["low", "moderate", "high", "critical"];
    for (const l of order) {
      if (levels.includes(l)) worstRisk = l;
    }
  }

  const severityMap: Record<string, ActionStatus["severity"]> = {
    low: "safe",
    moderate: "watch",
    high: "act",
    critical: "urgent",
  };
  const severity = severityMap[worstRisk] ?? "safe";

  const actions: string[] = [];
  const todayRain = today?.precipitation_sum ?? 0;
  const todayWind = today?.wind_max ?? 0;
  const todayMax = today?.temp_max ?? 25;

  if (todayRain > 10) {
    actions.push("Delay irrigation; significant rain expected today.");
  } else if (todayRain > 2) {
    actions.push("Light rain today; reduce irrigation by half.");
  }

  if (todayWind < 12 && todayRain < 1) {
    actions.push("Good spraying window this morning if wind stays low.");
  } else if (todayWind > 25) {
    actions.push("Avoid spraying; wind speeds exceed safe threshold.");
  }

  if (risks?.diseaseRisk.level === "critical" || risks?.diseaseRisk.level === "high") {
    actions.push("Scout crops for fungal pressure after recent wet conditions.");
  }

  if (risks?.heatStress.level === "critical" || risks?.heatStress.level === "high") {
    actions.push("Monitor heat stress; consider shade or irrigation if available.");
  }

  if (risks?.frostRisk.level === "critical" || risks?.frostRisk.level === "high") {
    actions.push("Frost risk detected; protect sensitive crops overnight.");
  }

  if (actions.length === 0) {
    actions.push("Conditions are favorable. Routine farm operations can proceed.");
  }

  // Derived primary status
  let primary = "Conditions favorable";
  let timeWindow = "Next 24 hours";
  let confidence = "High confidence";

  if (severity === "urgent") {
    primary = "Immediate action recommended";
    timeWindow = "Today";
    confidence = "High confidence";
  } else if (severity === "act") {
    primary = "Action recommended";
    timeWindow = "Next 24–48 hours";
    confidence = "Moderate confidence";
    if (risks?.diseaseRisk.level === "high" || risks?.diseaseRisk.level === "critical") {
      primary = "High disease pressure";
    } else if (risks?.heatStress.level === "high" || risks?.heatStress.level === "critical") {
      primary = "Monitor heat stress";
    }
  } else if (todayRain > 10) {
    primary = "Delay irrigation";
    timeWindow = "Next 24 hours";
  } else if (todayWind < 12 && todayRain < 1) {
    primary = "Good spraying window";
    timeWindow = "Next 24 hours";
  } else if (risks?.diseaseRisk.level === "moderate") {
    primary = "Disease watch";
    timeWindow = "Next 3 days";
    confidence = "Moderate confidence";
  }

  return { primary, timeWindow, actions: actions.slice(0, 3), confidence, severity };
}

const severityMeta = {
  safe: { color: "var(--risk-low)", bg: "rgba(74,140,92,0.08)", border: "rgba(74,140,92,0.2)", dot: "var(--risk-low)" },
  watch: { color: "var(--risk-mod)", bg: "rgba(184,134,11,0.08)", border: "rgba(184,134,11,0.2)", dot: "var(--risk-mod)" },
  act: { color: "var(--risk-high)", bg: "rgba(196,98,58,0.08)", border: "rgba(196,98,58,0.2)", dot: "var(--risk-high)" },
  urgent: { color: "var(--risk-crit)", bg: "rgba(168,50,50,0.08)", border: "rgba(168,50,50,0.2)", dot: "var(--risk-crit)" },
};

export function ActionSummary({ weather, selectedCrop, risks }: Props) {
  const status = deriveActionStatus(weather, selectedCrop, risks);
  const meta = severityMeta[status.severity];

  return (
    <div
      style={{
        border: `1px solid ${meta.border}`,
        background: meta.bg,
        borderRadius: "8px",
        borderLeft: `3px solid ${meta.color}`,
      }}
      className="p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: meta.dot }}
            />
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {status.primary}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 font-mono shrink-0"
              style={{
                color: meta.color,
                border: `1px solid ${meta.border}`,
                borderRadius: "3px",
              }}
            >
              {status.timeWindow}
            </span>
          </div>

          <div className="space-y-1.5 mt-3">
            {status.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: meta.color, flexShrink: 0, marginTop: 1 }}>▸</span>
                <span>{action}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-xs px-1.5 py-0.5"
              style={{
                color: "var(--text-dim)",
                border: "1px solid var(--border-soft)",
                borderRadius: "3px",
              }}
            >
              {status.confidence}
            </span>
            {selectedCrop && (
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                {selectedCrop.emoji} {selectedCrop.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
