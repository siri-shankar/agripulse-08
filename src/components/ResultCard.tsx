import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult, CROP_PH_RANGES, CROP_CRITICAL_RULES, HealthStatus } from "@/lib/soilAnalysis";
import {
  ChevronDown, CheckCircle2, AlertTriangle, XCircle, Leaf, Flower2,
  Apple, Droplets, FlaskConical, Zap, Package, BookOpen, Code2,
  ShieldCheck, ShieldAlert, ShieldX
} from "lucide-react";
import { useState } from "react";

const statusConfig: Record<HealthStatus, {
  border: string; shadow: string; scoreBg: string; badge: string;
  badgeBg: string; Icon: typeof CheckCircle2; iconAnim: string;
}> = {
  Healthy: {
    border: "border-agri-green/30", shadow: "shadow-glow-green", scoreBg: "bg-agri-green",
    badge: "text-agri-green", badgeBg: "bg-agri-green-pale",
    Icon: ShieldCheck, iconAnim: "animate-bounce-gentle",
  },
  Deficient: {
    border: "border-agri-gold/30", shadow: "shadow-glow-gold", scoreBg: "bg-agri-gold",
    badge: "text-agri-amber", badgeBg: "bg-agri-gold-pale",
    Icon: ShieldAlert, iconAnim: "animate-wiggle",
  },
  Critical: {
    border: "border-agri-red/30", shadow: "shadow-glow-red", scoreBg: "bg-agri-red",
    badge: "text-agri-red", badgeBg: "bg-agri-red-pale",
    Icon: ShieldX, iconAnim: "animate-pulse-scale",
  },
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

  const StatusIcon = cfg.Icon;

  const nutrients = [
    { key: "nitrogen" as const, label: "Nitrogen (N)", role: "leaf growth & green colour", Icon: Leaf, color: "text-agri-emerald" },
    { key: "phosphorus" as const, label: "Phosphorus (P)", role: "root development & flowering", Icon: Flower2, color: "text-pink-500" },
    { key: "potassium" as const, label: "Potassium (K)", role: "disease resistance & yield quality", Icon: Apple, color: "text-agri-red" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      className={`bg-card rounded-2xl border ${cfg.border} p-6 mb-5 shadow-card hover:shadow-card-hover transition-shadow duration-300`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 15, scale: 1.2 }} className="w-10 h-10 rounded-xl bg-agri-green-pale flex items-center justify-center">
            <Leaf className="w-5 h-5 text-agri-green animate-float" />
          </motion.div>
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">
              Soil Sample <span className="text-primary">{result.soil_id}</span>
            </h3>
            <p className="text-xs text-muted-foreground">Target crop: {result.target_crop}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} className={`${cfg.badgeBg} ${cfg.badge} px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${cfg.iconAnim}`} />
          {result.health_status}
        </motion.div>
      </div>

      {/* Score */}
      <div className="bg-muted/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            <Droplets className="w-4 h-4 text-primary" />
          </motion.div>
          <p className="text-sm font-bold text-foreground">Suitability Score</p>
        </div>
        <div className="bg-border/50 rounded-full h-8 w-full relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(score, 8)}%` }}
            transition={{ duration: 1, delay: index * 0.08, type: "spring" }}
            className={`${cfg.scoreBg} h-8 rounded-full flex items-center justify-center min-w-[60px]`}
          >
            <span className="text-sm font-extrabold text-primary-foreground drop-shadow">{score}/100</span>
          </motion.div>
        </div>
      </div>

      {/* pH & Nutrients */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-agri-cyan animate-wiggle" />
          <p className="text-sm font-bold text-foreground">pH & Nutrient Analysis</p>
        </div>

        <NutrientRow
          label="Soil pH"
          role="nutrient absorption efficiency"
          value={result.ph}
          threshold={`${phMin}–${phMax}`}
          isOk={phOk}
          fix={!phOk ? "Add lime (raise) or sulfur (lower) to adjust pH." : undefined}
          Icon={FlaskConical}
          iconColor="text-agri-cyan"
        />

        {nutrients.map(({ key, label, role, Icon, color }) => {
          const info = result.deficiencies[key];
          return (
            <NutrientRow
              key={key} label={label} role={role}
              value={info.value} threshold={String(info.threshold)}
              isOk={info.status === "ok"}
              fix={info.status === "low" ? `${info.fertilizer}` : undefined}
              Icon={Icon} iconColor={color}
            />
          );
        })}
      </div>

      {/* Fertilizer Plan */}
      {(() => {
        const noFert = result.recommendation.fertilizer_plan.startsWith("No");
        return (
          <motion.div whileHover={{ scale: 1.01 }}
            className={`rounded-xl p-4 mb-3 border ${noFert
              ? "border-agri-green/20 bg-agri-green-pale"
              : "border-agri-gold/20 bg-agri-gold-pale"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className={`w-4 h-4 ${noFert ? "text-agri-green animate-bounce-gentle" : "text-agri-amber animate-wiggle"}`} />
              <p className={`font-bold text-sm ${noFert ? "text-agri-green" : "text-agri-amber"}`}>
                Fertilizer Action Plan
              </p>
            </div>
            <p className="text-sm text-secondary-foreground font-medium">{result.recommendation.fertilizer_plan}</p>
          </motion.div>
        );
      })()}

      {/* Critical alert */}
      {critVal < critT && (
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-4 mb-3 border border-agri-gold/30 bg-agri-gold-pale"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-agri-amber animate-pulse-scale" />
            <span className="font-bold text-sm text-agri-amber">Critical Alert — {result.target_crop}</span>
          </div>
          <p className="text-xs text-secondary-foreground mt-1">
            Needs high {critL}. Current: <strong>{critVal}</strong> (min: <strong>{critT}</strong>). This will significantly reduce yield.
          </p>
        </motion.div>
      )}

      {/* Expandable sections */}
      <div className="flex gap-2 mt-4">
        <ExpandButton open={showExplanation} onClick={() => setShowExplanation(!showExplanation)}
          Icon={BookOpen} label="Explanation" />
        <ExpandButton open={showJson} onClick={() => setShowJson(!showJson)}
          Icon={Code2} label="JSON" />
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mt-3 bg-muted/40 rounded-xl p-4 text-sm text-secondary-foreground whitespace-pre-line leading-relaxed border border-border/50">
              {result.ai_explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showJson && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <pre className="mt-3 bg-foreground/5 rounded-xl p-4 text-xs text-agri-cyan overflow-auto max-h-64 border border-border/50">
              {JSON.stringify({ ...result, deficiencies: undefined, ph: undefined }, (_, v) => v === undefined ? undefined : v, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExpandButton({ open, onClick, Icon, label }: {
  open: boolean; onClick: () => void; Icon: typeof BookOpen; label: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
        ${open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function NutrientRow({ label, role, value, threshold, isOk, fix, Icon, iconColor }: {
  label: string; role: string; value: number; threshold: string; isOk: boolean; fix?: string;
  Icon: typeof Leaf; iconColor: string;
}) {
  return (
    <motion.div whileHover={{ x: 2 }}
      className={`rounded-xl p-3 border-l-[3px] transition-colors ${
        isOk ? "border-agri-green bg-agri-green-pale/50" : "border-agri-red bg-agri-red-pale/50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor} ${isOk ? "animate-float" : "animate-pulse-scale"}`} />
          <span className="font-semibold text-sm text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">— {role}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-card text-muted-foreground px-2 py-0.5 rounded-full text-xs border border-border/50">
            Need: <strong>{threshold}</strong>
          </span>
          <span className="bg-card text-foreground px-2 py-0.5 rounded-full text-xs border border-border/50">
            Got: <strong>{value}</strong>
          </span>
          {isOk ? (
            <span className="bg-agri-green-pale text-agri-green px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> OK
            </span>
          ) : (
            <span className="bg-agri-red-pale text-agri-red px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <XCircle className="w-3 h-3" /> LOW
            </span>
          )}
        </div>
      </div>
      {fix && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-agri-amber bg-agri-gold-pale rounded-lg px-3 py-1.5">
          <AlertTriangle className="w-3 h-3 animate-wiggle shrink-0" />
          <span><strong>Recommended:</strong> {fix}</span>
        </div>
      )}
    </motion.div>
  );
}
