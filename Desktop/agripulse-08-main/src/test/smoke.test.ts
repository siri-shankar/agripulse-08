/**
 * AgriPulse — Smoke Tests
 * Covers: core analysis logic, all crops, edge cases, scoring, health classification,
 * recommendation generation, and explanation text.
 */

import { describe, it, expect } from "vitest";
import {
  analyzeRow,
  CROP_PH_RANGES,
  CROP_CRITICAL_RULES,
  NUTRIENT_THRESHOLDS,
  CROP_EMOJIS,
  type SoilSample,
  type CropType,
} from "@/lib/soilAnalysis";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CROPS: CropType[] = ["TOMATO", "WHEAT", "RICE", "MAIZE"];

/** A perfectly healthy soil sample (all nutrients above every threshold, pH neutral). */
const healthySample: SoilSample = {
  soil_id: "S-HEALTHY",
  nitrogen: 100,
  phosphorus: 80,
  potassium: 300,
  ph: 6.5,
};

/** A critically deficient sample — every nutrient below threshold, bad pH. */
const criticalSample: SoilSample = {
  soil_id: "S-CRITICAL",
  nitrogen: 5,
  phosphorus: 5,
  potassium: 50,
  ph: 4.0,
};

/** Borderline sample — exactly at thresholds. */
const borderlineSample: SoilSample = {
  soil_id: "S-BORDER",
  nitrogen: 20,    // exactly at threshold
  phosphorus: 15,  // exactly at threshold
  potassium: 150,  // exactly at threshold
  ph: 6.5,
};

// ─── 1. Static config sanity checks ─────────────────────────────────────────

describe("Static config", () => {
  it("has pH ranges for all 4 crops", () => {
    CROPS.forEach((c) => {
      expect(CROP_PH_RANGES[c]).toHaveLength(2);
      const [min, max] = CROP_PH_RANGES[c];
      expect(min).toBeLessThan(max);
    });
  });

  it("has critical rules for all 4 crops", () => {
    CROPS.forEach((c) => {
      const rule = CROP_CRITICAL_RULES[c];
      expect(rule).toHaveLength(3);
      expect(["nitrogen", "phosphorus", "potassium"]).toContain(rule[0]);
      expect(typeof rule[1]).toBe("number");
    });
  });

  it("has emojis for all 4 crops", () => {
    CROPS.forEach((c) => {
      expect(CROP_EMOJIS[c]).toBeTruthy();
    });
  });

  it("NUTRIENT_THRESHOLDS covers nitrogen, phosphorus, potassium", () => {
    expect(NUTRIENT_THRESHOLDS).toHaveProperty("nitrogen");
    expect(NUTRIENT_THRESHOLDS).toHaveProperty("phosphorus");
    expect(NUTRIENT_THRESHOLDS).toHaveProperty("potassium");
  });
});

// ─── 2. analyzeRow — return shape ────────────────────────────────────────────

describe("analyzeRow — return shape", () => {
  it("returns all required fields", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result).toHaveProperty("soil_id");
    expect(result).toHaveProperty("target_crop");
    expect(result).toHaveProperty("health_status");
    expect(result).toHaveProperty("overall_health");
    expect(result).toHaveProperty("recommendation");
    expect(result).toHaveProperty("ai_explanation");
    expect(result).toHaveProperty("deficiencies");
    expect(result).toHaveProperty("ph");
  });

  it("echoes back soil_id and ph correctly", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.soil_id).toBe("S-HEALTHY");
    expect(result.ph).toBe(6.5);
  });

  it("echoes back target_crop correctly", () => {
    CROPS.forEach((c) => {
      expect(analyzeRow(healthySample, c).target_crop).toBe(c);
    });
  });

  it("suitability_score is a number between 0 and 100", () => {
    [healthySample, criticalSample, borderlineSample].forEach((sample) => {
      CROPS.forEach((c) => {
        const { recommendation } = analyzeRow(sample, c);
        expect(recommendation.suitability_score).toBeGreaterThanOrEqual(0);
        expect(recommendation.suitability_score).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ─── 3. Health classification ────────────────────────────────────────────────

describe("Health classification", () => {
  it("healthy sample scores Healthy for all crops", () => {
    CROPS.forEach((c) => {
      const result = analyzeRow(healthySample, c);
      expect(result.health_status).toBe("Healthy");
      expect(result.recommendation.suitability_score).toBeGreaterThanOrEqual(80);
    });
  });

  it("critical sample scores Critical for all crops", () => {
    CROPS.forEach((c) => {
      const result = analyzeRow(criticalSample, c);
      expect(result.health_status).toBe("Critical");
      expect(result.recommendation.suitability_score).toBeLessThan(50);
    });
  });

  it("borderline sample is not Critical (all nutrients exactly at threshold)", () => {
    CROPS.forEach((c) => {
      const result = analyzeRow(borderlineSample, c);
      // Nutrients are AT threshold (not below), so no nutrient deduction — score should be >= 50
      expect(result.health_status).not.toBe("Critical");
    });
  });
});

// ─── 4. Nutrient deficiency detection ───────────────────────────────────────

describe("Nutrient deficiency detection", () => {
  it("marks all nutrients ok for healthy sample", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.deficiencies.nitrogen.status).toBe("ok");
    expect(result.deficiencies.phosphorus.status).toBe("ok");
    expect(result.deficiencies.potassium.status).toBe("ok");
  });

  it("marks all nutrients low for critical sample", () => {
    const result = analyzeRow(criticalSample, "WHEAT");
    expect(result.deficiencies.nitrogen.status).toBe("low");
    expect(result.deficiencies.phosphorus.status).toBe("low");
    expect(result.deficiencies.potassium.status).toBe("low");
  });

  it("detects only nitrogen deficiency when only nitrogen is low", () => {
    const sample: SoilSample = { ...healthySample, nitrogen: 10 };
    const result = analyzeRow(sample, "TOMATO");
    expect(result.deficiencies.nitrogen.status).toBe("low");
    expect(result.deficiencies.phosphorus.status).toBe("ok");
    expect(result.deficiencies.potassium.status).toBe("ok");
  });

  it("deficiency values match the input sample values", () => {
    const result = analyzeRow(criticalSample, "TOMATO");
    expect(result.deficiencies.nitrogen.value).toBe(5);
    expect(result.deficiencies.phosphorus.value).toBe(5);
    expect(result.deficiencies.potassium.value).toBe(50);
  });
});

// ─── 5. Fertilizer recommendation text ──────────────────────────────────────

describe("Fertilizer recommendation", () => {
  it("recommends 'No fertilizer needed' for a healthy sample", () => {
    const result = analyzeRow(healthySample, "RICE");
    expect(result.recommendation.fertilizer_plan).toMatch(/no fertilizer needed/i);
  });

  it("recommends Urea when only nitrogen is low", () => {
    const sample: SoilSample = { ...healthySample, nitrogen: 10 };
    const result = analyzeRow(sample, "MAIZE");
    expect(result.recommendation.fertilizer_plan).toMatch(/urea/i);
  });

  it("recommends DAP when only phosphorus is low", () => {
    const sample: SoilSample = { ...healthySample, phosphorus: 5 };
    const result = analyzeRow(sample, "TOMATO");
    expect(result.recommendation.fertilizer_plan).toMatch(/dap/i);
  });

  it("recommends MOP when only potassium is low", () => {
    const sample: SoilSample = { ...healthySample, potassium: 50 };
    const result = analyzeRow(sample, "WHEAT");
    expect(result.recommendation.fertilizer_plan).toMatch(/mop/i);
  });

  it("recommends multiple fertilizers when multiple nutrients are low", () => {
    const result = analyzeRow(criticalSample, "RICE");
    const plan = result.recommendation.fertilizer_plan;
    expect(plan).toMatch(/urea/i);
    expect(plan).toMatch(/dap/i);
    expect(plan).toMatch(/mop/i);
  });
});

// ─── 6. AI explanation content ──────────────────────────────────────────────

describe("AI explanation", () => {
  it("mentions the soil_id", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.ai_explanation).toContain("S-HEALTHY");
  });

  it("mentions the crop name", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.ai_explanation.toLowerCase()).toContain("tomato");
  });

  it("mentions the pH value", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.ai_explanation).toContain("6.5");
  });

  it("contains the suitability score", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(result.ai_explanation).toContain(
      String(result.recommendation.suitability_score)
    );
  });

  it("flags pH as outside range for critical sample (pH 4.0)", () => {
    const result = analyzeRow(criticalSample, "TOMATO");
    expect(result.ai_explanation).toMatch(/outside ideal range/i);
  });

  it("shows 'Immediate action needed' for Critical soil", () => {
    const result = analyzeRow(criticalSample, "WHEAT");
    expect(result.ai_explanation).toMatch(/immediate action needed/i);
  });
});

// ─── 7. pH boundary conditions ──────────────────────────────────────────────

describe("pH boundary conditions", () => {
  it("TOMATO: pH exactly at lower bound (6.0) does not deduct score vs pH 6.5", () => {
    const atLower: SoilSample = { ...healthySample, ph: 6.0 };
    const mid: SoilSample = { ...healthySample, ph: 6.5 };
    // Both should be in range — scores should be equal
    expect(analyzeRow(atLower, "TOMATO").recommendation.suitability_score).toBe(
      analyzeRow(mid, "TOMATO").recommendation.suitability_score
    );
  });

  it("pH well outside range reduces score by 20 compared to in-range pH", () => {
    const inRange: SoilSample = { ...healthySample, ph: 6.5 };
    const outOfRange: SoilSample = { ...healthySample, ph: 3.0 };
    const diff =
      analyzeRow(inRange, "TOMATO").recommendation.suitability_score -
      analyzeRow(outOfRange, "TOMATO").recommendation.suitability_score;
    expect(diff).toBeGreaterThanOrEqual(20);
  });
});

// ─── 8. Crop-specific critical rules ────────────────────────────────────────

describe("Crop-specific critical rules", () => {
  it("WHEAT: nitrogen below critical threshold (30) triggers extra score deduction", () => {
    const aboveCrit: SoilSample = { ...healthySample, nitrogen: 35 };
    const belowCrit: SoilSample = { ...healthySample, nitrogen: 25 };
    const above = analyzeRow(aboveCrit, "WHEAT").recommendation.suitability_score;
    const below = analyzeRow(belowCrit, "WHEAT").recommendation.suitability_score;
    expect(above).toBeGreaterThan(below);
  });

  it("TOMATO: potassium below 200 triggers extra score deduction", () => {
    const aboveCrit: SoilSample = { ...healthySample, potassium: 250 };
    const belowCrit: SoilSample = { ...healthySample, potassium: 180 };
    const above = analyzeRow(aboveCrit, "TOMATO").recommendation.suitability_score;
    const below = analyzeRow(belowCrit, "TOMATO").recommendation.suitability_score;
    expect(above).toBeGreaterThan(below);
  });

  it("RICE: phosphorus below 25 triggers extra score deduction", () => {
    const aboveCrit: SoilSample = { ...healthySample, phosphorus: 30 };
    const belowCrit: SoilSample = { ...healthySample, phosphorus: 20 };
    const above = analyzeRow(aboveCrit, "RICE").recommendation.suitability_score;
    const below = analyzeRow(belowCrit, "RICE").recommendation.suitability_score;
    expect(above).toBeGreaterThan(below);
  });

  it("MAIZE: nitrogen below 35 triggers extra score deduction", () => {
    const aboveCrit: SoilSample = { ...healthySample, nitrogen: 40 };
    const belowCrit: SoilSample = { ...healthySample, nitrogen: 30 };
    const above = analyzeRow(aboveCrit, "MAIZE").recommendation.suitability_score;
    const below = analyzeRow(belowCrit, "MAIZE").recommendation.suitability_score;
    expect(above).toBeGreaterThan(below);
  });
});

// ─── 9. overall_health map ───────────────────────────────────────────────────

describe("overall_health map", () => {
  it("overall_health keys match deficiency keys", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    expect(Object.keys(result.overall_health).sort()).toEqual(
      ["nitrogen", "phosphorus", "potassium"].sort()
    );
  });

  it("overall_health values are 'ok' for healthy sample", () => {
    const result = analyzeRow(healthySample, "TOMATO");
    Object.values(result.overall_health).forEach((v) => expect(v).toBe("ok"));
  });

  it("overall_health values are 'low' for critical sample", () => {
    const result = analyzeRow(criticalSample, "TOMATO");
    Object.values(result.overall_health).forEach((v) => expect(v).toBe("low"));
  });
});
