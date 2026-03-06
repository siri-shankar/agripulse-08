import { motion } from "framer-motion";
import { AnalysisResult, CROP_PH_RANGES, CROP_CRITICAL_RULES, HealthStatus } from "@/lib/soilAnalysis";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const statusConfig: Record<HealthStatus, { border: string; scoreBg: string; badge: string; badgeBg: string; icon: string }> = {
  Healthy: { border: "border-agri-green", scoreBg: "bg-agri-green", badge: "text-agri-green", badgeBg: "bg-agri-green/15", icon: "✅" },
  Deficient: { border: "border-agri-gold", scoreBg: "bg-agri-gold", badge: "text-agri-gold", badgeBg: "bg-agri-gold/15", icon: "⚠️" },
  Critical: { border: "border-agri-red", scoreBg: "bg-agri-red", badge: "text-agri-red", badgeBg: "bg-agri-red/15", icon: "🚨" },
};

export function ResultCard({ result, index }: { result: AnalysisResult; index: number }) {
  const [showExplanation, setShowExplanation] = useState(index === 0);
  const [showJson, setShowJson] = useState(false);
  const cfg = statusConfig[result.health_status];
  const [phMin, phMax] = CROP_PH_RANGES[result.target_crop];
  const phOk = result.ph >= phMin && result.ph <= phMax;
  const [critN, critT, critL] = CROP_CRITICAL_RULES[result.target_crop];
  const critVal = result.deficiencies[critN].value;
  const score = result.recommendation.suitability_score;

  const nutrients = [
    { key: "nitrogen" as const, label: "🌿 Nitrogen (N)", role: "leaf growth & green colour" },
    { key: "phosphorus" as const, label: "🌸 Phosphorus (P)", role: "root development & flowering" },
    { key: "potassium" as const, label: "🍎 Potassium (K)", role: "disease resistance & yield quality" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card rounded-2xl border-2 ${cfg.border} p-6 mb-6 shadow-lg`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-display font-bold text-primary">
          🌱 Soil Sample{" "}
          <code className="bg-secondary px-2 py-0.5 rounded text-agri-cyan text-lg">{result.soil_id}</code>
        </h3>
        <span className={`${cfg.badgeBg} ${cfg.badge} px-4 py-1.5 rounded-full font-extrabold text-sm border ${cfg.border}`}>
          {cfg.icon} {result.health_status}
        </span>
      </div>

      <hr className="border-border mb-4" />

      {/* Score */}
      <p className="text-sm font-bold text-primary mb-1">📊 Soil Suitability Score</p>
      <div className="bg-muted rounded-lg h-7 w-full relative overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          className={`${cfg.scoreBg} h-7 rounded-lg flex items-center justify-center min-w-[60px]`}
        >
          <span className="text-sm font-extrabold text-primary-foreground">{score} / 100</span>
        </motion.div>
      </div>

      <hr className="border-border my-4" />

      {/* pH */}
      <p className="text-sm font-bold text-primary mb-2">🧪 Soil pH & Nutrient Check</p>
      <NutrientRow
        label="Soil pH"
        role="affects how nutrients are absorbed"
        value={result.ph}
        threshold={`${phMin} – ${phMax}`}
        isOk={phOk}
        fix={!phOk ? "Add lime to raise pH or sulfur to lower pH." : undefined}
      />

      {nutrients.map(({ key, label, role }) => {
        const info = result.deficiencies[key];
        return (
          <NutrientRow
            key={key}
            label={label}
            role={role}
            value={info.value}
            threshold={String(info.threshold)}
            isOk={info.status === "ok"}
            fix={info.status === "low" ? `Apply: ${info.fertilizer}` : undefined}
          />
        );
      })}

      <hr className="border-border my-4" />

      {/* Fertilizer plan */}
      {(() => {
        const noFert = result.recommendation.fertilizer_plan.startsWith("No");
        return (
          <div className={`rounded-xl p-4 border-2 ${noFert ? "border-agri-green bg-agri-green/10" : "border-agri-gold bg-agri-gold/10"}`}>
            <p className={`font-extrabold text-sm mb-1 ${noFert ? "text-primary" : "text-agri-gold"}`}>
              {noFert ? "✅" : "🧺"} Fertilizer Action Plan
            </p>
            <p className="text-sm font-semibold text-secondary-foreground">{result.recommendation.fertilizer_plan}</p>
          </div>
        );
      })()}

      {/* Critical alert */}
      {critVal < critT && (
        <div className="mt-4 rounded-xl p-4 border-2 border-agri-gold bg-agri-gold/10">
          <span className="font-extrabold text-sm text-agri-gold">⚡ CRITICAL ALERT for {result.target_crop}: </span>
          <span className="text-sm text-agri-gold-light">
            Needs high {critL}. Level {critVal} &lt; {critT}. This will reduce yield.
          </span>
        </div>
      )}

      {/* Explanation */}
      <button onClick={() => setShowExplanation(!showExplanation)} className="mt-4 flex items-center gap-2 text-accent font-bold text-sm hover:opacity-80 transition-opacity">
        📖 Full Explanation <ChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? "rotate-180" : ""}`} />
      </button>
      {showExplanation && (
        <div className="mt-2 bg-secondary rounded-xl p-4 text-sm text-secondary-foreground whitespace-pre-line leading-relaxed">
          {result.ai_explanation}
        </div>
      )}

      {/* JSON */}
      <button onClick={() => setShowJson(!showJson)} className="mt-2 flex items-center gap-2 text-accent font-bold text-sm hover:opacity-80 transition-opacity">
        🗂️ Raw JSON <ChevronDown className={`w-4 h-4 transition-transform ${showJson ? "rotate-180" : ""}`} />
      </button>
      {showJson && (
        <pre className="mt-2 bg-secondary rounded-xl p-4 text-xs text-agri-cyan overflow-auto max-h-64">
          {JSON.stringify(
            { ...result, deficiencies: undefined, ph: undefined },
            (_, v) => v === undefined ? undefined : v,
            2
          )}
        </pre>
      )}
    </motion.div>
  );
}

function NutrientRow({ label, role, value, threshold, isOk, fix }: {
  label: string; role: string; value: number; threshold: string; isOk: boolean; fix?: string;
}) {
  return (
    <div className={`rounded-xl p-3 mb-2 border-l-4 ${isOk ? "border-agri-green bg-agri-green/5" : "border-agri-red bg-agri-red/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>{isOk ? "✅" : "❌"}</span>
          <span className="font-bold text-sm text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">— {role}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
            Threshold: <strong>{threshold}</strong>
          </span>
          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
            Value: <strong>{value}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOk ? "bg-agri-green/15 text-agri-green" : "bg-agri-red/15 text-agri-red"}`}>
            {isOk ? "SUFFICIENT" : "LOW"}
          </span>
        </div>
      </div>
      {fix && (
        <div className="mt-2 border-l-2 border-agri-gold bg-agri-gold/10 rounded px-3 py-1.5 text-xs text-agri-gold">
          💊 <strong>Apply:</strong> {fix}
        </div>
      )}
    </div>
  );
}
