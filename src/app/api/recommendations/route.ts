import { NextRequest, NextResponse } from "next/server";
import type { WeatherDay, CurrentWeather } from "@/types/weather";
import type { CropProfile, FarmingRecommendation, GrowthStage } from "@/types/crops";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateLLMResponse(parsed: any): FarmingRecommendation[] {
  const arr = parsed?.recommendations ?? parsed;
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr
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

function buildMessages(crop: CropProfile, current: CurrentWeather, forecast: WeatherDay[], growthStage?: GrowthStage | null) {
  const daily = forecast.slice(0, 7).map(d => {
    const date = new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return `${date}: ${d.condition_code.replace(/_/g, " ")}, high ${Math.round(d.temp_max)}°C, low ${Math.round(d.temp_min)}°C, ${d.precipitation_sum.toFixed(1)}mm rain (${d.precipitation_probability}% chance), wind ${d.wind_max}km/h`;
  }).join("\n");

  const system = `You are an agricultural advisor for smallholder farmers in East Africa. Generate 3-5 specific, actionable farming recommendations based on real weather data. Always output valid JSON.`;

  const stageLine = growthStage ? `\nGrowth stage: ${growthStage} — tailor advice to this specific phase.` : "";

  const user = `Crop: ${crop.name} (${crop.emoji})
Category: ${crop.category}
Ideal temperature: ${crop.idealTemperature[0]}–${crop.idealTemperature[1]}°C
Rainfall needs: ${crop.rainfallNeeds}
Growing seasons: ${crop.growingSeasons.join(", ")}
Sensitivities: ${crop.sensitivity.join(", ")}
${stageLine}
Current weather: ${Math.round(current.temperature)}°C, feels like ${Math.round(current.feels_like ?? current.temperature)}°C, humidity ${current.humidity ?? "N/A"}%, wind ${current.wind_speed}km/h

7-day forecast:
${daily}

Return a JSON object with a "recommendations" array. Each recommendation must have:
- category: one of irrigation, fertilizer, planting, harvesting, pest, general
- priority: one of urgent, high, medium, low
- title: short action title (5-8 words)
- detail: 1-2 sentences with specific weather numbers
- icon: single emoji

Prioritize actions that help a farmer TODAY. Reference actual forecast values.`;

  return { system, user };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { current, forecast, crop, growthStage } = body as { current: CurrentWeather; forecast: WeatherDay[]; crop: CropProfile; growthStage?: GrowthStage | null };
    if (!current || !forecast?.length || !crop) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
    }

    const { system, user } = buildMessages(crop, current, forecast, growthStage);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: `API error ${res.status}` } }));
        return NextResponse.json({ error: (err as { error?: { message?: string } }).error?.message ?? `DeepSeek API error ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return NextResponse.json({ error: "Empty response from DeepSeek" }, { status: 500 });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "DeepSeek returned non-JSON response" }, { status: 500 });
      }

      const recommendations = validateLLMResponse(parsed);
      if (recommendations.length === 0) {
        return NextResponse.json({ error: "Failed to parse recommendations" }, { status: 500 });
      }

      return NextResponse.json({ recommendations });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return NextResponse.json({
      error: isTimeout ? "Recommendation request timed out — try again" : err instanceof Error ? err.message : "Failed to generate recommendations",
    }, { status: isTimeout ? 504 : 500 });
  }
}
