import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Wheat, BarChart3, FileSpreadsheet, FileJson,
  TrendingUp, AlertCircle, CheckCircle2, Activity, Sprout,
} from "lucide-react";
import {
  analyzeRow, SoilSample, CropType, AnalysisResult,
  CROP_EMOJIS, HealthStatus,
} from "@/lib/soilAnalysis";
import { ResultCard } from "@/components/ResultCard";

const CROPS: CropType[] = ["TOMATO", "WHEAT", "RICE", "MAIZE"];

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [crop, setCrop] = useState<CropType>("TOMATO");
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [filter, setFilter] = useState<HealthStatus | "All">("All");
  const [rawData, setRawData] = useState<SoilSample[] | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("agripulse_data");
    const name = sessionStorage.getItem("agripulse_filename");
    if (!data) {
      navigate("/upload");
      return;
    }
    const rows: SoilSample[] = JSON.parse(data);
    setRawData(rows);
    setFileName(name || "data.csv");
    setResults(rows.map((r) => analyzeRow(r, crop)));
  }, []);

  const changeCrop = useCallback((newCrop: CropType) => {
    setCrop(newCrop);
    setResults((prev) => {
      if (!prev) return null;
      return prev.map((r) =>
        analyzeRow(
          {
            soil_id: r.soil_id,
            nitrogen: r.deficiencies.nitrogen.value,
            phosphorus: r.deficiencies.phosphorus.value,
            potassium: r.deficiencies.potassium.value,
            ph: r.ph,
          },
          newCrop
        )
      );
    });
    setFilter("All");
  }, []);

  const filtered = results
    ? filter === "All"
      ? results
      : results.filter((r) => r.health_status === filter)
    : null;

  const scores = results?.map((r) => r.recommendation.suitability_score) || [];
  const avgScore = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : "0";

  const downloadCSV = () => {
    if (!results) return;
    const rows = results.map((r) => ({
      soil_id: r.soil_id,
      target_crop: r.target_crop,
      health_status: r.health_status,
      suitability_score: r.recommendation.suitability_score,
      nitrogen_status: r.overall_health.nitrogen,
      phosphorus_status: r.overall_health.phosphorus,
      potassium_status: r.overall_health.potassium,
      fertilizer_plan: r.recommendation.fertilizer_plan,
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(csv, `agripulse_${crop.toLowerCase()}_results.csv`, "text/csv");
  };

  const downloadJSON = () => {
    if (!results) return;
    const data = results.map(({ deficiencies, ph, ...rest }) => rest);
    downloadBlob(
      JSON.stringify(data, null, 2),
      `agripulse_${crop.toLowerCase()}_results.json`,
      "application/json"
    );
  };

  if (!results) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed circular crop icons on left and right sides */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {CROPS.slice(0, 2).map((c) => (
          <motion.button
            key={c}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => changeCrop(c)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all shadow-lg ${
              crop === c
                ? "bg-primary text-primary-foreground shadow-glow-green ring-2 ring-primary/30"
                : "bg-card text-muted-foreground border border-border hover:border-primary/40"
            }`}
          >
            <span className="text-xl leading-none">{CROP_EMOJIS[c]}</span>
            <span className="text-[10px] mt-0.5">{c.charAt(0) + c.slice(1).toLowerCase()}</span>
          </motion.button>
        ))}
      </div>
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {CROPS.slice(2, 4).map((c) => (
          <motion.button
            key={c}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => changeCrop(c)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all shadow-lg ${
              crop === c
                ? "bg-primary text-primary-foreground shadow-glow-green ring-2 ring-primary/30"
                : "bg-card text-muted-foreground border border-border hover:border-primary/40"
            }`}
          >
            <span className="text-xl leading-none">{CROP_EMOJIS[c]}</span>
            <span className="text-[10px] mt-0.5">{c.charAt(0) + c.slice(1).toLowerCase()}</span>
          </motion.button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary animate-bounce-gentle" />
              Analysis Results
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <strong className="text-primary">{results.length}</strong> sample(s) ·{" "}
              {CROP_EMOJIS[crop]} {crop}
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard
            icon={<Wheat className="w-5 h-5 text-agri-gold animate-wiggle" />}
            label="Crop"
            value={crop.charAt(0) + crop.slice(1).toLowerCase()}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-primary animate-bounce-gentle" />}
            label="Avg Score"
            value={`${avgScore}/100`}
          />
          <MetricCard
            icon={<CheckCircle2 className="w-5 h-5 text-agri-green animate-float" />}
            label="Healthy"
            value={`${results.filter((r) => r.health_status === "Healthy").length}/${results.length}`}
          />
          <MetricCard
            icon={<AlertCircle className="w-5 h-5 text-agri-red animate-pulse-scale" />}
            label="Critical"
            value={`${results.filter((r) => r.health_status === "Critical").length}/${results.length}`}
          />
        </div>

        <hr className="border-border mb-5" />

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground mr-1">Filter:</span>
          {(["All", "Healthy", "Deficient", "Critical"] as const).map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-glow-green"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Results */}
        <AnimatePresence mode="popLayout">
          {filtered && filtered.length > 0 ? (
            filtered.map((r, i) => <ResultCard key={r.soil_id} result={r} index={i} />)
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm py-8 text-center"
            >
              No samples match this filter.
            </motion.p>
          )}
        </AnimatePresence>

        <hr className="border-border my-6" />

        {/* Downloads */}
        <h3 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary animate-bounce-gentle" />
          Download Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3.5 hover:bg-primary/90 transition-colors shadow-glow-green"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadJSON}
            className="flex items-center justify-center gap-2 bg-foreground/10 text-foreground font-bold rounded-xl py-3.5 hover:bg-foreground/15 transition-colors border border-border"
          >
            <FileJson className="w-4 h-4" /> Download JSON
          </motion.button>
        </div>
      </div>
    </div>
  );
};

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-all"
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-display font-extrabold text-foreground">{value}</p>
    </motion.div>
  );
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default AnalysisPage;
