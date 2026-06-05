export type CropCategory = "cereal" | "legume" | "vegetable" | "cash_crop" | "fruit" | "tuber" | "spice" | "tree_crop";

export type GrowthStage = "planting" | "vegetative" | "flowering" | "fruiting" | "harvest";

export const GROWTH_STAGES: { id: GrowthStage; label: string; description: string }[] = [
  { id: "planting", label: "Planting", description: "Seed germination and early establishment" },
  { id: "vegetative", label: "Vegetative", description: "Leaf and stem development phase" },
  { id: "flowering", label: "Flowering", description: "Bloom and pollination period" },
  { id: "fruiting", label: "Fruiting", description: "Grain/fruit fill and maturation" },
  { id: "harvest", label: "Harvest", description: "Ripening and harvest readiness" },
];

export interface CropProfile {
  id: string;
  name: string;
  emoji: string;
  category: CropCategory;
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
