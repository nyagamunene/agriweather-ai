"use client";
import { useMemo, useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import type { WeatherResponse, GeocodingResult } from "@/types/weather";
import type { CropProfile, AgriculturalRisk, FarmingRecommendation } from "@/types/crops";
import type { ReportData } from "@/types/reports";
import { downloadReportPDF } from "@/lib/pdf/generateReport";

interface Props {
  weather: WeatherResponse;
  location: GeocodingResult;
  selectedCrop: CropProfile | null;
  risks: AgriculturalRisk | null;
  recommendations: FarmingRecommendation[];
}

export function ReportGenerator({ weather, location, selectedCrop, risks, recommendations }: Props) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => {
    const daily = weather.daily.slice(0, 7);
    const temps = daily.map(d => (d.temp_max + d.temp_min) / 2);
    return {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      totalRainfall: daily.reduce((s, d) => s + d.precipitation_sum, 0),
      rainDays: daily.filter(d => d.precipitation_sum > 1).length,
      maxWind: Math.max(...daily.map(d => d.wind_max)),
      minTemp: Math.min(...daily.map(d => d.temp_min)),
      maxTemp: Math.max(...daily.map(d => d.temp_max)),
    };
  }, [weather]);

  const handleDownload = () => {
    setGenerating(true);
    const reportData: ReportData = {
      generatedAt: new Date().toISOString(),
      location: {
        name: location.name,
        lat: location.lat,
        lon: location.lon,
        country: location.country,
        state: location.state,
      },
      weather: {
        current: weather.current,
        daily: weather.daily.slice(0, 7),
        hourly: weather.hourly.slice(0, 24),
      },
      crop: selectedCrop,
      risks,
      recommendations,
      summary,
    };

    // Use requestAnimationFrame to let the UI update before blocking with PDF gen
    requestAnimationFrame(() => {
      try {
        downloadReportPDF(reportData);
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleCopySummary = () => {
    const parts: string[] = [];
    parts.push(`📍 ${location.name}`);
    parts.push(`📅 ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}`);
    parts.push(`🌡 Avg: ${summary.avgTemp.toFixed(1)}°C | Rain: ${summary.totalRainfall.toFixed(1)}mm`);
    if (selectedCrop) parts.push(`🌱 Crop: ${selectedCrop.name}`);
    if (risks) {
      const worst = Object.entries(risks).filter(([_, r]) => r.level === "critical" || r.level === "high");
      if (worst.length > 0) {
        parts.push(`⚠ Risks: ${worst.map(([k]) => k.replace(/([A-Z])/g, " $1")).join(", ")}`);
      }
    }
    if (recommendations.length > 0) {
      parts.push(`💡 ${recommendations[0].title}: ${recommendations[0].detail}`);
    }
    navigator.clipboard.writeText(parts.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const today = weather.daily[0];

  return (
    <div className="space-y-4">
      {/* Report preview card */}
      <div
        style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "8px" }}
        className="p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>
              Report Preview
            </span>
            <p className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>
              {location.name.split(",")[0]}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-US", { dateStyle: "full" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                background: copied ? "var(--risk-low-bg, rgba(74,140,92,0.1))" : "var(--bg-raised)",
                color: copied ? "var(--risk-low)" : "var(--text-muted)",
                borderRadius: "5px",
                border: `1px solid ${copied ? "var(--risk-low-border, rgba(74,140,92,0.3))" : "var(--border-soft)"}`,
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy summary"}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                background: generating ? "var(--bg-raised)" : "var(--accent)",
                color: generating ? "var(--text-muted)" : "#0f0e0b",
                borderRadius: "5px",
                border: "none",
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "Generating..." : <><Download size={12} /> Download PDF</>}
            </button>
          </div>
        </div>

        {/* Report sections preview */}
        <div className="space-y-4">
          {/* Weather Summary */}
          <SectionPreview title="7-Day Weather Summary">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PreviewStat label="Avg Temp" value={`${summary.avgTemp.toFixed(1)}°C`} />
              <PreviewStat label="Range" value={`${summary.minTemp.toFixed(0)}° – ${summary.maxTemp.toFixed(0)}°`} />
              <PreviewStat label="Total Rain" value={`${summary.totalRainfall.toFixed(1)} mm`} accent />
              <PreviewStat label="Rainy Days" value={`${summary.rainDays} of 7`} />
            </div>
          </SectionPreview>

          {/* Daily Forecast */}
          <SectionPreview title="Daily Forecast (7 days)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: "var(--text-dim)" }}>
                    <td className="py-1 pr-2">Day</td>
                    <td className="py-1 pr-2">High / Low</td>
                    <td className="py-1 pr-2">Rain</td>
                    <td className="py-1">Wind</td>
                  </tr>
                </thead>
                <tbody>
                  {weather.daily.slice(0, 7).map((day, i) => {
                    const date = new Date(day.date);
                    return (
                      <tr key={i} style={{ color: "var(--text-muted)" }}>
                        <td className="py-1 pr-2" style={{ color: "var(--text-dim)" }}>
                          {date.toLocaleDateString("en-US", { weekday: "short" })} {date.getDate()}
                        </td>
                        <td className="py-1 pr-2" style={{ color: "var(--text)" }}>
                          {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
                        </td>
                        <td className="py-1 pr-2" style={{ color: day.precipitation_sum > 1 ? "var(--rain)" : "var(--text-dim)" }}>
                          {day.precipitation_sum.toFixed(1)}mm
                        </td>
                        <td className="py-1">
                          {day.wind_max} km/h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionPreview>

          {/* Crop Analysis */}
          {selectedCrop && (
            <SectionPreview title={`Crop: ${selectedCrop.emoji} ${selectedCrop.name}`}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {selectedCrop.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <PreviewStat label="Ideal Temp" value={`${selectedCrop.idealTemperature[0]}°–${selectedCrop.idealTemperature[1]}°C`} />
                <PreviewStat label="Rain Need" value={selectedCrop.rainfallNeeds} />
                <PreviewStat label="Season" value={selectedCrop.growingSeasons.join(", ")} />
                <PreviewStat label="Sensitivity" value={selectedCrop.sensitivity.length > 0 ? selectedCrop.sensitivity.join(", ") : "None"} />
              </div>
            </SectionPreview>
          )}

          {/* Risk Analysis */}
          {risks && (
            <SectionPreview title="Risk Analysis">
              <div className="space-y-2.5">
                {(Object.keys(risks) as Array<keyof AgriculturalRisk>).map(key => {
                  const risk = risks[key];
                  const labels: Record<string, string> = { drought: "Drought", flood: "Flood", heatStress: "Heat Stress", frostRisk: "Frost", diseaseRisk: "Disease" };
                  const codes: Record<string, string> = { drought: "DRT", flood: "FLD", heatStress: "HT", frostRisk: "FRS", diseaseRisk: "DSE" };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-8" style={{ color: "var(--text-dim)" }}>{codes[key]}</span>
                      <span className="text-xs w-20" style={{ color: "var(--text)" }}>{labels[key]}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${risk.score}%`,
                            background: `var(--risk-${risk.level === "critical" ? "crit" : risk.level === "moderate" ? "mod" : risk.level})`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-18 text-right" style={{
                        color: `var(--risk-${risk.level === "critical" ? "crit" : risk.level === "moderate" ? "mod" : risk.level})`,
                      }}>
                        {risk.label} ({risk.score}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionPreview>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <SectionPreview title={`Recommendations (${recommendations.length})`}>
              <div className="space-y-2">
                {recommendations.slice(0, 5).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm">{rec.icon}</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{rec.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{rec.detail}</p>
                    </div>
                  </div>
                ))}
                {recommendations.length > 5 && (
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    +{recommendations.length - 5} more recommendations in PDF
                  </p>
                )}
              </div>
            </SectionPreview>
          )}

          {/* What's not included guidance */}
          {!selectedCrop && (
            <div
              className="p-3 text-xs"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-soft)", borderRadius: "5px", color: "var(--text-muted)" }}
            >
              Switch to the <strong>Crop Intelligence</strong> tab and select a crop to include risk analysis and recommendations in your report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionPreview({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div style={{ width: "3px", height: "12px", background: "var(--accent)", borderRadius: "1px" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PreviewStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="px-3 py-2"
      style={{ border: "1px solid var(--border-soft)", background: "var(--bg-raised)", borderRadius: "4px" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: accent ? "var(--rain)" : "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}
