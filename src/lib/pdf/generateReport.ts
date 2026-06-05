import { jsPDF } from "jspdf";
import type { ReportData } from "@/types/reports";

const HEADER_BG = "#1a1814";
const TEXT = "#1a1814";
const MUTED = "#5c564a";
const DIM = "#8a8070";
const ACCENT = "#b0880f";
const ACCENT_DIM = "#8a6a0b";
const LINE = "#d4d0c7";
const SURFACE = "#f0efe9";
const SURFACE_ALT = "#e8e5de";
const RAIN = "#3a6fa0";
const RISK_LOW = "#3d7a4e";
const RISK_MOD = "#a07808";
const RISK_HIGH = "#b85530";
const RISK_CRIT = "#9a2d2d";

const riskColor: Record<string, string> = {
  low: RISK_LOW,
  moderate: RISK_MOD,
  high: RISK_HIGH,
  critical: RISK_CRIT,
};

const riskBg: Record<string, string> = {
  low: "#e8f0e9",
  moderate: "#f5eed8",
  high: "#f5e5de",
  critical: "#f5dede",
};

const riskCodes: Record<string, string> = {
  drought: "DRT",
  flood: "FLD",
  heatStress: "HT",
  frostRisk: "FRS",
  diseaseRisk: "DSE",
};

const riskLabels: Record<string, string> = {
  drought: "Drought",
  flood: "Flood",
  heatStress: "Heat Stress",
  frostRisk: "Frost",
  diseaseRisk: "Disease",
};

function header(doc: jsPDF, y: number): number {
  doc.setFillColor(HEADER_BG);
  doc.rect(0, 0, 210, y + 12, "F");

  doc.setFontSize(18);
  doc.setTextColor(ACCENT);
  doc.setFont("helvetica", "bold");
  doc.text("A", 14, y);
  doc.setFontSize(14);
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "normal");
  doc.text("griWeather.AI", 22, y);

  doc.setFontSize(8);
  doc.setTextColor("#a09888");
  doc.text("Farm Intelligence Report", 14, y + 6);

  doc.setDrawColor(LINE);
  doc.setLineWidth(0.5);
  doc.line(14, y + 12, 196, y + 12);

  return y + 20;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);

  doc.setDrawColor(ACCENT);
  doc.setLineWidth(0.5);
  doc.line(14, y + 5, 60, y + 5);

  return y + 13;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, y: number, x0: number, x1: number): number {
  doc.setFontSize(8);
  doc.setTextColor(DIM);
  doc.setFont("helvetica", "normal");
  doc.text(label, x0, y);
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.text(value, x1, y);
  return y + 5;
}

export function generateReportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 16;

  y = header(doc, y);

  // ── Meta ──
  doc.setFontSize(8);
  doc.setTextColor(DIM);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`, 14, y);
  doc.text(`Location: ${data.location.name}`, 14, y + 5);
  doc.text(`Coords: ${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}`, 14, y + 10);
  y += 16;

  // ── Weather Summary ──
  y = sectionTitle(doc, "7-Day Weather Summary", y);

  const s = data.summary;
  const col1 = 14;
  const col2 = 80;

  y = drawInfoRow(doc, "Avg Temperature", `${s.avgTemp.toFixed(1)}°C`, y, col1, col2);
  y = drawInfoRow(doc, "Temperature Range", `${s.minTemp.toFixed(0)}° – ${s.maxTemp.toFixed(0)}°C`, y, col1, col2);
  y = drawInfoRow(doc, "Total Rainfall", `${s.totalRainfall.toFixed(1)} mm`, y, col1, col2);
  y = drawInfoRow(doc, "Rainy Days", `${s.rainDays} of 7`, y, col1, col2);
  y = drawInfoRow(doc, "Peak Wind", `${s.maxWind} km/h`, y, col1, col2);
  y += 4;

  // ── 7-Day Forecast Table ──
  y = sectionTitle(doc, "Daily Forecast", y);

  doc.setFillColor(SURFACE);
  doc.rect(14, y - 4, 182, 6, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DIM);
  doc.text("Day", 16, y);
  doc.text("Condition", 54, y);
  doc.text("High", 104, y);
  doc.text("Low", 122, y);
  doc.text("Rain", 140, y);
  doc.text("Wind", 164, y);
  doc.text("Sunrise", 188, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  for (let i = 0; i < data.weather.daily.length; i++) {
    const day = data.weather.daily[i];
    if (y > 268) {
      doc.addPage();
      y = 20;
    }
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = date.getDate();

    if (i % 2 === 1) {
      doc.setFillColor(SURFACE_ALT);
      doc.rect(14, y - 3, 182, 5, "F");
    }

    doc.setTextColor(DIM);
    doc.setFontSize(7);
    doc.text(`${dayName} ${dayNum}`, 16, y);
    doc.setTextColor(TEXT);
    doc.text(day.condition_code.replace(/_/g, " "), 54, y);
    doc.text(`${Math.round(day.temp_max)}°`, 104, y);
    doc.setTextColor(MUTED);
    doc.text(`${Math.round(day.temp_min)}°`, 122, y);
    doc.setTextColor(RAIN);
    doc.text(`${day.precipitation_sum.toFixed(1)}mm`, 140, y);
    doc.setTextColor(TEXT);
    doc.text(`${day.wind_max}km/h`, 164, y);
    doc.setTextColor(DIM);
    doc.text(new Date(day.sunrise).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), 188, y);
    y += 5;
  }
  y += 4;

  // ── Crop & Risk Analysis ──
  if (data.crop && data.risks) {
    y = sectionTitle(doc, `Crop Analysis: ${data.crop.name}`, y);

    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(data.crop.description, 140);
    doc.text(descLines, 14, y);
    y += descLines.length * 4 + 4;

    y = drawInfoRow(doc, "Ideal Temperature", `${data.crop.idealTemperature[0]}° – ${data.crop.idealTemperature[1]}°C`, y, col1, col2);
    y = drawInfoRow(doc, "Rainfall Need", data.crop.rainfallNeeds, y, col1, col2);
    y = drawInfoRow(doc, "Seasons", data.crop.growingSeasons.join(", "), y, col1, col2);
    if (data.crop.sensitivity.length > 0) {
      y = drawInfoRow(doc, "Sensitivity", data.crop.sensitivity.join(", "), y, col1, col2);
    }
    if (data.growthStage) {
      y = drawInfoRow(doc, "Growth Stage", data.growthStage.charAt(0).toUpperCase() + data.growthStage.slice(1), y, col1, col2);
    }
    y += 4;

    y = sectionTitle(doc, "Risk Analysis", y);

    const riskEntries = Object.entries(data.risks) as Array<[string, { level: string; score: number; description: string }]>;
    for (const [key, risk] of riskEntries) {
      if (y > 268) {
        doc.addPage();
        y = 20;
      }

      const color = riskColor[risk.level] ?? MUTED;
      const bg = riskBg[risk.level] ?? SURFACE;

      doc.setFillColor(bg);
      doc.roundedRect(14, y - 1, 182, 12, 2, 2, "F");

      // Risk bar background
      doc.setFillColor(SURFACE_ALT);
      doc.roundedRect(64, y + 4, 80, 3, 1, 1, "F");

      // Risk bar fill
      doc.setFillColor(color);
      doc.roundedRect(64, y + 4, (80 * risk.score) / 100, 3, 1, 1, "F");

      doc.setFontSize(8);
      doc.setTextColor(DIM);
      doc.setFont("helvetica", "bold");
      doc.text(riskCodes[key] ?? key, 16, y + 6, { baseline: "middle" });

      doc.setFontSize(8);
      doc.setTextColor(TEXT);
      doc.setFont("helvetica", "normal");
      doc.text(riskLabels[key] ?? key, 36, y + 6, { baseline: "middle" });

      doc.setFontSize(7);
      doc.setTextColor(color);
      doc.setFont("helvetica", "bold");
      doc.text(risk.level.toUpperCase(), 148, y + 6, { baseline: "middle" });

      doc.setFontSize(7);
      doc.setTextColor(MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(`${risk.score}%`, 180, y + 6, { baseline: "middle" });

      y += 12;
    }
    y += 4;
  }

  // ── Recommendations ──
  if (data.recommendations.length > 0) {
    y = sectionTitle(doc, "Farming Recommendations", y);

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...data.recommendations].sort(
      (a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99) -
                (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99)
    );

    for (const rec of sorted) {
      if (y > 268) {
        doc.addPage();
        y = 20;
      }

      const color = riskColor[rec.priority] ?? MUTED;
      const bg = riskBg[rec.priority] ?? SURFACE;

      doc.setFillColor(bg);
      doc.roundedRect(14, y - 1, 182, 14, 2, 2, "F");

      // Colored left edge indicator
      doc.setFillColor(color);
      doc.rect(14, y - 1, 3, 14, "F");

      doc.setFontSize(7);
      doc.setTextColor(color);
      doc.setFont("helvetica", "bold");
      doc.text(rec.priority.toUpperCase(), 20, y + 2);

      doc.setFontSize(8);
      doc.setTextColor(TEXT);
      doc.setFont("helvetica", "bold");
      doc.text(`${rec.title}`, 35, y + 2);

      doc.setFontSize(7);
      doc.setTextColor(MUTED);
      doc.setFont("helvetica", "normal");
      const detailLines = doc.splitTextToSize(rec.detail, 145);
      doc.text(detailLines, 35, y + 6);

      y += 14;
    }
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(DIM);
    doc.text(`AgriWeather.AI — Farm Intelligence Report — Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
  }

  return doc;
}

export function downloadReportPDF(data: ReportData): void {
  const doc = generateReportPDF(data);
  const filename = `agriweather-report-${data.location.name.split(",")[0].replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
