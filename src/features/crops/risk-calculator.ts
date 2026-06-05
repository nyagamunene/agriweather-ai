import type { WeatherDay } from "@/types/weather";
import type { CropProfile, AgriculturalRisk, RiskLevel } from "@/types/crops";

function toRiskLevel(score: number): RiskLevel {
  if (score >= 75) return { level: "critical", score, label: "Critical", description: "Immediate action required" };
  if (score >= 50) return { level: "high", score, label: "High", description: "Close monitoring needed" };
  if (score >= 25) return { level: "moderate", score, label: "Moderate", description: "Monitor conditions" };
  return { level: "low", score, label: "Low", description: "Conditions favorable" };
}

export function calculateRisks(forecast: WeatherDay[], crop: CropProfile): AgriculturalRisk {
  const days = forecast.slice(0, 7);

  const avgPrecip = days.reduce((s, d) => s + d.precipitation_sum, 0) / days.length;
  const avgTemp = days.reduce((s, d) => s + (d.temp_max + d.temp_min) / 2, 0) / days.length;

  const droughtScore = Math.min(100,
    (crop.rainfallNeeds === "high" ? 1.4 : crop.rainfallNeeds === "moderate" ? 1.0 : 0.6) *
    Math.max(0, (3 - avgPrecip) * 15 + Math.max(0, avgTemp - crop.idealTemperature[1]) * 5)
  );

  const maxDayPrecip = Math.max(...days.map(d => d.precipitation_sum));
  const totalPrecip = days.reduce((s, d) => s + d.precipitation_sum, 0);
  const floodScore = Math.min(100, maxDayPrecip * 4 + (totalPrecip > 50 ? (totalPrecip - 50) * 0.8 : 0));

  const hotDays = days.filter(d => d.temp_max > crop.idealTemperature[1] + 3).length;
  const heatScore = Math.min(100, hotDays * 15 + Math.max(0, avgTemp - crop.idealTemperature[1]) * 8);

  const coldDays = days.filter(d => d.temp_min < 4).length;
  const frostScore = Math.min(100, coldDays * 20 + Math.max(0, 4 - Math.min(...days.map(d => d.temp_min))) * 10);

  const wetDays = days.filter(d => d.precipitation_sum > 1).length;
  const diseaseScore = Math.min(100,
    wetDays * 8 +
    (avgTemp > 15 && avgTemp < 28 ? 15 : 0) +
    (crop.sensitivity.some(s => s.includes("blight") || s.includes("disease") || s.includes("rust")) ? 10 : 0)
  );

  return {
    drought: toRiskLevel(Math.round(droughtScore)),
    flood: toRiskLevel(Math.round(floodScore)),
    heatStress: toRiskLevel(Math.round(heatScore)),
    frostRisk: toRiskLevel(Math.round(frostScore)),
    diseaseRisk: toRiskLevel(Math.round(diseaseScore)),
  };
}
