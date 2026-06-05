import { jsPDF } from "jspdf";
import type { ReportData } from "@/types/reports";

const DARK = "#0f0e0b";
const TEXT = "#f0ece3";
const MUTED = "#8a8070";
const DIM = "#4a4540";
const ACCENT = "#d4a517";
const BORDER = "#2a2520";
const SURFACE = "#161410";
const RAIN = "#4a7fb0";
const RISK_LOW = "#4a8c5c";
const RISK_MOD = "#b8860b";
const RISK_HIGH = "#c4623a";
const RISK_CRIT = "#a83232";

const riskColor: Record<string, string> = {
  low: RISK_LOW,
  moderate: RISK_MOD,
  high: RISK_HIGH,
  critical: RISK_CRIT,
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
  doc.setFillColor(DARK);
  doc.rect(0, 0, 210, y + 14, "F");

  doc.setFontSize(18);
  doc.setTextColor(ACCENT);
  doc.setFont("helvetica", "bold");
  doc.text("A", 14, y);
  doc.setFontSize(14);
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("griWeather.AI", 22, y);

  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("Farm Intelligence Report", 14, y + 7);

  // Divider
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.5);
  doc.line(14, y + 14, 196, y + 14);

  return y + 22;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, y + 4, 196, y + 4);
  return y + 12;
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

  // ── Header ──
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
  const col3 = 110;
  const col4 = 170;

  y = drawInfoRow(doc, "Avg Temperature", `${s.avgTemp.toFixed(1)}°C`, y, col1, col2);
  y = drawInfoRow(doc, "Temperature Range", `${s.minTemp.toFixed(0)}° – ${s.maxTemp.toFixed(0)}°C`, y, col1, col2);
  y = drawInfoRow(doc, "Total Rainfall", `${s.totalRainfall.toFixed(1)} mm`, y, col1, col2);
  y = drawInfoRow(doc, "Rainy Days", `${s.rainDays} of 7`, y, col1, col2);
  y = drawInfoRow(doc, "Peak Wind", `${s.maxWind} km/h`, y, col1, col2);
  y += 4;

  // ── 7-Day Forecast Table ──
  y = sectionTitle(doc, "Daily Forecast", y);

  // Table header
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(MUTED);
  const tY = y;
  doc.text("Day", 14, tY);
  doc.text("Condition", 52, tY);
  doc.text("High", 102, tY);
  doc.text("Low", 120, tY);
  doc.text("Rain", 138, tY);
  doc.text("Wind", 162, tY);
  doc.text("Sunrise", 186, tY);
  y += 5;

  doc.setFont("helvetica", "normal");
  for (const day of data.weather.daily) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = date.getDate();

    doc.setTextColor(DIM);
    doc.setFontSize(7);
    doc.text(`${dayName} ${dayNum}`, 14, y);
    doc.setTextColor(TEXT);
    doc.text(day.condition_code.replace(/_/g, " "), 52, y);
    doc.text(`${Math.round(day.temp_max)}°`, 102, y);
    doc.setTextColor(MUTED);
    doc.text(`${Math.round(day.temp_min)}°`, 120, y);
    doc.setTextColor(RAIN);
    doc.text(`${day.precipitation_sum.toFixed(1)}mm`, 138, y);
    doc.setTextColor(TEXT);
    doc.text(`${day.wind_max}km/h`, 162, y);
    doc.setTextColor(MUTED);
    doc.text(new Date(day.sunrise).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), 186, y);
    y += 4;
  }
  y += 6;

  // ── Crop & Risk Analysis ──
  if (data.crop && data.risks) {
    y = sectionTitle(doc, `Crop Analysis: ${data.crop.emoji} ${data.crop.name}`, y);

    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(data.crop.description, 140);
    doc.text(descLines, 14, y);
    y += descLines.length * 4 + 4;

    y = drawInfoRow(doc, "Ideal Temp", `${data.crop.idealTemperature[0]}° – ${data.crop.idealTemperature[1]}°C`, y, col1, col2);
    y = drawInfoRow(doc, "Rainfall Need", data.crop.rainfallNeeds, y, col1, col2);
    y = drawInfoRow(doc, "Growing Seasons", data.crop.growingSeasons.join(", "), y, col1, col2);
    if (data.crop.sensitivity.length > 0) {
      y = drawInfoRow(doc, "Sensitivity", data.crop.sensitivity.join(", "), y, col1, col2);
    }
    y += 4;

    y = sectionTitle(doc, "Risk Analysis", y);

    const riskEntries = Object.entries(data.risks) as Array<[string, { level: string; score: number; description: string }]>;
    for (const [key, risk] of riskEntries) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      const color = riskColor[risk.level] ?? MUTED;
      doc.setFillColor(DARK);
      doc.roundedRect(14, y - 1, 182, 14, 2, 2, "F");

      // Risk bar background
      doc.setFillColor(SURFACE);
      doc.roundedRect(64, y + 4, 80, 3, 1, 1, "F");

      // Risk bar fill
      doc.setFillColor(color);
      doc.roundedRect(64, y + 4, (80 * risk.score) / 100, 3, 1, 1, "F");

      doc.setFontSize(8);
      doc.setTextColor(DIM);
      doc.setFont("helvetica", "bold");
      doc.text(riskCodes[key] ?? key, 16, y + 7, { baseline: "middle" });

      doc.setFontSize(8);
      doc.setTextColor(TEXT);
      doc.setFont("helvetica", "normal");
      doc.text(riskLabels[key] ?? key, 36, y + 7, { baseline: "middle" });

      doc.setFontSize(7);
      doc.setTextColor(color);
      doc.setFont("helvetica", "bold");
      doc.text(risk.level.toUpperCase(), 148, y + 7, { baseline: "middle" });

      doc.setFontSize(7);
      doc.setTextColor(MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(`${risk.score}%`, 180, y + 7, { baseline: "middle" });

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
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const color = riskColor[rec.priority] ?? MUTED;
      doc.setFillColor(DARK);
      doc.roundedRect(14, y - 1, 182, 16, 2, 2, "F");

      doc.setFontSize(8);
      doc.setTextColor(color);
      doc.setFont("helvetica", "bold");
      doc.text(rec.priority.toUpperCase(), 16, y + 4);

      doc.setFontSize(9);
      doc.setTextColor(TEXT);
      doc.setFont("helvetica", "bold");
      doc.text(`${rec.icon} ${rec.title}`, 35, y + 4);

      doc.setFontSize(7);
      doc.setTextColor(MUTED);
      doc.setFont("helvetica", "normal");
      const detailLines = doc.splitTextToSize(rec.detail, 145);
      doc.text(detailLines, 35, y + 8);

      y += 16;
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
