export interface CropProfile {
  id: string;
  name: string;
  emoji: string;
  idealTemperature: [number, number];
  rainfallNeeds: "low" | "moderate" | "high";
  humidityRange: [number, number];
  growingSeasons: string[];
  sensitivity: string[];
  description: string;
}

export interface RiskLevel {
  level: "low" | "moderate" | "high" | "critical";
  score: number;
  label: string;
  description: string;
}

export interface AgriculturalRisk {
  drought: RiskLevel;
  flood: RiskLevel;
  heatStress: RiskLevel;
  frostRisk: RiskLevel;
  diseaseRisk: RiskLevel;
}

export interface FarmingRecommendation {
  category: "irrigation" | "fertilizer" | "planting" | "harvesting" | "pest" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  detail: string;
  icon: string;
}
