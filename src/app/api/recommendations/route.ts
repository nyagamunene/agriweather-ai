import { NextRequest, NextResponse } from "next/server";
import type { WeatherDay, CurrentWeather } from "@/types/weather";
import type { CropProfile, FarmingRecommendation } from "@/types/crops";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateLLMResponse(parsed: any): FarmingRecommendation[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  return parsed
    .filter((rec: Record<string, unknown>) =>
      typeof rec === "object" &&
      typeof rec.title === "string" &&
      typeof rec.detail === "string" &&
      ["irrigation", "fertilizer", "planting", "harvesting", "pest", "general"].includes(rec.category as string) &&
      ["urgent", "high", "medium", "low"].includes(rec.priority as string)
    )
    .map((rec: Record<string, string>) => ({
      category: rec.category as FarmingRecommendation["category"],
      priority: rec.priority as FarmingRecommendation["priority"],
      title: rec.title,
      detail: rec.detail,
      icon: rec.icon ?? "🌿",
    }))
    .slice(0, 5);
}

function buildPrompt(crop: CropProfile, current: CurrentWeather, forecast: WeatherDay[]): string {
  const daily = forecast.slice(0, 7).map(d => {
    const date = new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return `${date}: ${d.condition_code.replace(/_/g, " ")}, high ${Math.round(d.temp_max)}°C, low ${Math.round(d.temp_min)}°C, ${d.precipitation_sum.toFixed(1)}mm rain (${d.precipitation_probability}% chance), wind ${d.wind_max}km/h`;
  }).join("\n");

  return `You are an agricultural advisor for smallholder farmers in East Africa. Generate 3-5 specific, actionable farming recommendations for the following crop and weather conditions.

Crop: ${crop.name} (${crop.emoji})
Category: ${crop.category}
Ideal temperature: ${crop.idealTemperature[0]}–${crop.idealTemperature[1]}°C
Rainfall needs: ${crop.rainfallNeeds}
Growing seasons: ${crop.growingSeasons.join(", ")}
Sensitivities: ${crop.sensitivity.join(", ")}

Current weather: ${Math.round(current.temperature)}°C, feels like ${Math.round(current.feels_like ?? current.temperature)}°C, humidity ${current.humidity ?? "N/A"}%, wind ${current.wind_speed}km/h

7-day forecast:
${daily}

Return ONLY a JSON array of recommendations (no markdown, no explanation). Each recommendation must have:
- category: one of "irrigation", "fertilizer", "planting", "harvesting", "pest", "general"
- priority: one of "urgent", "high", "medium", "low"
- title: short action title (5-8 words max)
- detail: 1-2 sentence explanation with specific weather numbers
- icon: single emoji relevant to the recommendation

Prioritize actions that would help a farmer TODAY. Reference actual temperatures, rain amounts, and wind speeds from the forecast.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { current, forecast, crop } = body as { current: CurrentWeather; forecast: WeatherDay[]; crop: CropProfile };
    if (!current || !forecast || !crop) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildPrompt(crop, current, forecast);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const result = await model.generateContent(prompt, { signal: controller.signal });
      const text = result.response.text();

      let parsed: unknown;
      try {
        const match = text.match(/\[[\s\S]*\]/);
        parsed = JSON.parse(match ? match[0] : text.replace(/```json\s*|\s*```/g, "").trim());
      } catch {
        return NextResponse.json({ error: "Gemini returned non-JSON response" }, { status: 500 });
      }

      const recommendations = validateLLMResponse(parsed);

      if (recommendations.length === 0) {
        return NextResponse.json({ error: "Failed to parse Gemini recommendations" }, { status: 500 });
      }

      return NextResponse.json({ recommendations });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to generate recommendations" }, { status: 500 });
  }
}
