import { NextRequest, NextResponse } from "next/server";
import type { WeatherDay, CurrentWeather } from "@/types/weather";
import type { CropProfile, FarmingRecommendation } from "@/types/crops";

function generateRecommendations(
  current: CurrentWeather,
  forecast: WeatherDay[],
  crop: CropProfile
): FarmingRecommendation[] {
  const recs: FarmingRecommendation[] = [];
  const next3 = forecast.slice(0, 3);
  const totalRain = next3.reduce((s, d) => s + d.precipitation_sum, 0);
  const avgTemp = next3.reduce((s, d) => s + (d.temp_max + d.temp_min) / 2, 0) / 3;
  const rainDays = next3.filter(d => d.precipitation_sum > 2).length;
  const highRainDays = next3.filter(d => d.precipitation_probability > 60).length;

  if (totalRain < 5 && crop.rainfallNeeds !== "low") {
    recs.push({
      category: "irrigation",
      priority: totalRain === 0 ? "urgent" : "high",
      title: "Irrigation Required",
      detail: `Only ${totalRain.toFixed(1)}mm expected in the next 3 days. ${crop.name} requires consistent moisture. Schedule irrigation to maintain soil moisture levels.`,
      icon: "💧",
    });
  } else if (totalRain > 30 && crop.rainfallNeeds === "low") {
    recs.push({
      category: "irrigation",
      priority: "medium",
      title: "Excess Moisture Risk",
      detail: `${totalRain.toFixed(0)}mm expected over 3 days. ${crop.name} prefers drier conditions — ensure drainage channels are clear.`,
      icon: "🌊",
    });
  }

  if (highRainDays >= 2) {
    recs.push({
      category: "fertilizer",
      priority: "high",
      title: "Delay Fertilizer Application",
      detail: "Heavy rainfall is forecast over the next 3 days. Delay fertilizer application to prevent nutrient runoff and protect waterways.",
      icon: "⏸️",
    });
  } else if (rainDays === 0 && (current.humidity ?? 60) < 60) {
    recs.push({
      category: "fertilizer",
      priority: "medium",
      title: "Favorable Fertilizer Window",
      detail: "Dry conditions ahead create an ideal window for fertilizer application. Apply before evening to minimize volatilization losses.",
      icon: "✅",
    });
  }

  if (avgTemp > crop.idealTemperature[1] + 3) {
    recs.push({
      category: "general",
      priority: "urgent",
      title: "Heat Stress Alert",
      detail: `Average temperatures of ${avgTemp.toFixed(1)}°C exceed ${crop.name}'s ideal range (${crop.idealTemperature[0]}–${crop.idealTemperature[1]}°C). Consider shade netting and increase irrigation frequency.`,
      icon: "🌡️",
    });
  }

  const coldNight = next3.find(d => d.temp_min < 4);
  if (coldNight) {
    recs.push({
      category: "general",
      priority: "urgent",
      title: "Frost Risk Warning",
      detail: `Temperatures may drop to ${coldNight.temp_min.toFixed(1)}°C on ${coldNight.date}. Protect ${crop.name} plants with frost covers or smudge pots.`,
      icon: "🧊",
    });
  }

  if (rainDays >= 2 && avgTemp > 15 && avgTemp < 28 && crop.sensitivity.some(s => s.includes("blight") || s.includes("disease") || s.includes("rust"))) {
    const disease = crop.sensitivity.find(s => s.includes("blight") || s.includes("disease") || s.includes("rust")) ?? "fungal disease";
    recs.push({
      category: "pest",
      priority: "high",
      title: "Disease Risk Elevated",
      detail: `Wet, warm conditions are ideal for ${disease}. Inspect crops regularly and consider preventive fungicide application before rain.`,
      icon: "🦠",
    });
  }

  if (avgTemp >= crop.idealTemperature[0] && avgTemp <= crop.idealTemperature[1] && totalRain > 5 && totalRain < 25) {
    recs.push({
      category: "planting",
      priority: "medium",
      title: "Good Planting Conditions",
      detail: `Temperature and moisture are within the ideal range for ${crop.name}. This is a favorable planting window if within your growing season.`,
      icon: "🌱",
    });
  }

  const windyDay = next3.find(d => d.wind_max > 40);
  if (windyDay) {
    recs.push({
      category: "general",
      priority: "high",
      title: "High Wind Advisory",
      detail: `Wind speeds up to ${windyDay.wind_max}km/h forecast. Secure farm structures, delay spraying, and check staking on tall crops.`,
      icon: "💨",
    });
  }

  if (recs.length === 0) {
    recs.push({
      category: "general",
      priority: "low",
      title: "Conditions Favorable",
      detail: `Weather conditions are suitable for ${crop.name} cultivation. Continue standard agronomic practices and monitor daily forecasts.`,
      icon: "🌿",
    });
  }

  return recs.sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { current, forecast, crop } = body as { current: CurrentWeather; forecast: WeatherDay[]; crop: CropProfile };
    if (!current || !forecast || !crop) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const recommendations = generateRecommendations(current, forecast, crop);
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
