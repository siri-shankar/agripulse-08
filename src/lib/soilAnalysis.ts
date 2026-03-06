// Core analysis logic ported from Python

export interface SoilSample {
  soil_id: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
}

export type CropType = "TOMATO" | "WHEAT" | "RICE" | "MAIZE";
export type HealthStatus = "Healthy" | "Deficient" | "Critical";
export type NutrientStatus = "ok" | "low";

export interface NutrientInfo {
  status: NutrientStatus;
  value: number;
  threshold: number;
  fertilizer: string | null;
}

export interface Deficiencies {
  nitrogen: NutrientInfo;
  phosphorus: NutrientInfo;
  potassium: NutrientInfo;
}

export interface AnalysisResult {
  soil_id: string;
  target_crop: CropType;
  health_status: HealthStatus;
  overall_health: Record<string, NutrientStatus>;
  recommendation: {
    fertilizer_plan: string;
    suitability_score: number;
  };
  ai_explanation: string;
  deficiencies: Deficiencies;
  ph: number;
}

export const CROP_PH_RANGES: Record<CropType, [number, number]> = {
  TOMATO: [6.0, 7.0],
  WHEAT: [6.0, 7.5],
  RICE: [5.0, 6.5],
  MAIZE: [5.8, 7.0],
};

export const CROP_CRITICAL_RULES: Record<CropType, [keyof Deficiencies, number, string]> = {
  TOMATO: ["potassium", 200, "Potassium"],
  WHEAT: ["nitrogen", 30, "Nitrogen"],
  RICE: ["phosphorus", 25, "Phosphorus"],
  MAIZE: ["nitrogen", 35, "Nitrogen"],
};

export const NUTRIENT_THRESHOLDS: Record<string, [number, string]> = {
  nitrogen: [20, "Urea"],
  phosphorus: [15, "DAP (Diammonium Phosphate)"],
  potassium: [150, "MOP (Muriate of Potash)"],
};

export const CROP_EMOJIS: Record<CropType, string> = {
  TOMATO: "🍅",
  WHEAT: "🌾",
  RICE: "🌾",
  MAIZE: "🌽",
};

function checkDeficiencies(row: SoilSample): Deficiencies {
  const result = {} as Deficiencies;
  for (const [nutrient, [threshold, fertilizer]] of Object.entries(NUTRIENT_THRESHOLDS)) {
    const value = row[nutrient as keyof SoilSample] as number;
    if (value < threshold) {
      result[nutrient as keyof Deficiencies] = { status: "low", value, threshold, fertilizer };
    } else {
      result[nutrient as keyof Deficiencies] = { status: "ok", value, threshold, fertilizer: null };
    }
  }
  return result;
}

function calculateScore(row: SoilSample, crop: CropType, deficiencies: Deficiencies): number {
  let score = 100;
  const [phMin, phMax] = CROP_PH_RANGES[crop];
  if (row.ph < phMin || row.ph > phMax) score -= 20;
  for (const info of Object.values(deficiencies)) {
    if (info.status === "low") score -= 15;
  }
  const [critNutrient, critThreshold] = CROP_CRITICAL_RULES[crop];
  if (deficiencies[critNutrient].value < critThreshold) score -= 10;
  return Math.max(score, 0);
}

function classifyHealth(score: number): HealthStatus {
  if (score >= 80) return "Healthy";
  if (score >= 50) return "Deficient";
  return "Critical";
}

function generateRecommendation(deficiencies: Deficiencies): string {
  const needed = Object.values(deficiencies)
    .filter((i) => i.status === "low")
    .map((i) => i.fertilizer!);
  if (!needed.length) return "No fertilizer needed. Soil nutrients are within optimal range.";
  if (needed.length === 1) return `Apply ${needed[0]}`;
  return "Apply " + needed.slice(0, -1).join(", ") + ` and ${needed[needed.length - 1]}`;
}

function generateExplanation(
  row: SoilSample, crop: CropType, deficiencies: Deficiencies, score: number, health: HealthStatus
): string {
  const [phMin, phMax] = CROP_PH_RANGES[crop];
  const phOk = row.ph >= phMin && row.ph <= phMax;
  const lines: string[] = [
    `Your soil (ID: ${row.soil_id}) has been analyzed for growing ${crop.charAt(0) + crop.slice(1).toLowerCase()}.`,
    "",
  ];

  if (phOk) {
    lines.push(`✅ pH Level (${row.ph}): Ideal for ${crop} (range: ${phMin}–${phMax}).`);
  } else {
    lines.push(`⚠️ pH Level (${row.ph}): Outside ideal range (${phMin}–${phMax}). Consider lime or sulfur.`);
  }
  lines.push("");

  const meta: Record<string, [string, string]> = {
    nitrogen: ["Nitrogen (N)", "leaf growth and green colour"],
    phosphorus: ["Phosphorus (P)", "root development and flowering"],
    potassium: ["Potassium (K)", "disease resistance and yield quality"],
  };
  for (const [n, [label, role]] of Object.entries(meta)) {
    const info = deficiencies[n as keyof Deficiencies];
    if (info.status === "low") {
      lines.push(`🔴 ${label} (${info.value}): LOW — Apply ${info.fertilizer} for ${role}.`);
    } else {
      lines.push(`🟢 ${label} (${info.value}): OK — Sufficient for ${role}.`);
    }
  }
  lines.push("");

  const [critN, critT, critL] = CROP_CRITICAL_RULES[crop];
  if (deficiencies[critN].value < critT) {
    lines.push(`⚡ Critical: ${crop} needs high ${critL}. Level ${deficiencies[critN].value} < ${critT}.`);
    lines.push("");
  }

  const advice: Record<HealthStatus, string> = {
    Healthy: "Soil is in great shape! Maintain current levels.",
    Deficient: "Apply recommended fertilizers before sowing.",
    Critical: "Immediate action needed. Re-test in 2–3 weeks.",
  };
  lines.push(`📋 Score: ${score}/100 (${health}). ${advice[health]}`);
  return lines.join("\n");
}

export function analyzeRow(row: SoilSample, crop: CropType): AnalysisResult {
  const deficiencies = checkDeficiencies(row);
  const score = calculateScore(row, crop, deficiencies);
  const health = classifyHealth(score);
  const recommendation = generateRecommendation(deficiencies);
  const explanation = generateExplanation(row, crop, deficiencies, score, health);

  return {
    soil_id: row.soil_id,
    target_crop: crop,
    health_status: health,
    overall_health: {
      nitrogen: deficiencies.nitrogen.status,
      phosphorus: deficiencies.phosphorus.status,
      potassium: deficiencies.potassium.status,
    },
    recommendation: { fertilizer_plan: recommendation, suitability_score: score },
    ai_explanation: explanation,
    deficiencies,
    ph: row.ph,
  };
}
