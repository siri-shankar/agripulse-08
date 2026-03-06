import { useState, useCallback } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, Wheat, Sprout, BarChart3, FileSpreadsheet,
  Leaf, Beaker, ChevronDown, FileJson, TrendingUp, AlertCircle,
  CheckCircle2, XOctagon, HelpCircle, Activity, Sparkles, Sun
} from "lucide-react";
import {
  analyzeRow, SoilSample, CropType, AnalysisResult,
  CROP_PH_RANGES, CROP_CRITICAL_RULES, CROP_EMOJIS, HealthStatus,
} from "@/lib/soilAnalysis";
import { ResultCard } from "@/components/ResultCard";

const CROPS: CropType[] = ["TOMATO", "WHEAT", "RICE", "MAIZE"];
const REQUIRED = ["soil_id", "nitrogen", "phosphorus", "potassium", "ph"];

const Index = () => {
  const [crop, setCrop] = useState<CropType>("TOMATO");
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<HealthStatus | "All">("All");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields?.map((f) => f.toLowerCase().trim()) || [];
        const missing = REQUIRED.filter((r) => !cols.includes(r));
        if (missing.length) {
          setError(`Missing columns: ${missing.join(", ")}`);
          setResults(null);
          return;
        }
        const rows: SoilSample[] = res.data.map((d: any) => ({
          soil_id: String(d.soil_id || d.Soil_id || d.SOIL_ID || ""),
          nitrogen: Number(d.nitrogen || d.Nitrogen || 0),
          phosphorus: Number(d.phosphorus || d.Phosphorus || 0),
          potassium: Number(d.potassium || d.Potassium || 0),
          ph: Number(d.ph || d.pH || d.PH || 0),
        }));
        setResults(rows.map((r) => analyzeRow(r, crop)));
        setFilter("All");
      },
      error: () => { setError("Could not read CSV file."); setResults(null); },
    });
  }, [crop]);

  const reAnalyze = useCallback((newCrop: CropType) => {
    setCrop(newCrop);
    setResults((prev) => {
      if (!prev) return null;
      return prev.map((r) => analyzeRow({
        soil_id: r.soil_id,
        nitrogen: r.deficiencies.nitrogen.value,
        phosphorus: r.deficiencies.phosphorus.value,
        potassium: r.deficiencies.potassium.value,
        ph: r.ph,
      }, newCrop));
    });
  }, []);

  const filtered = results
    ? filter === "All" ? results : results.filter((r) => r.health_status === filter)
    : null;

  const scores = results?.map((r) => r.recommendation.suitability_score) || [];
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0";

  const downloadCSV = () => {
    if (!results) return;
    const rows = results.map((r) => ({
      soil_id: r.soil_id, target_crop: r.target_crop, health_status: r.health_status,
      suitability_score: r.recommendation.suitability_score,
      nitrogen_status: r.overall_health.nitrogen, phosphorus_status: r.overall_health.phosphorus,
      potassium_status: r.overall_health.potassium, fertilizer_plan: r.recommendation.fertilizer_plan,
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(csv, `agripulse_${crop.toLowerCase()}_results.csv`, "text/csv");
  };

  const downloadJSON = () => {
    if (!results) return;
    const data = results.map(({ deficiencies, ph, ...rest }) => rest);
    downloadBlob(JSON.stringify(data, null, 2), `agripulse_${crop.toLowerCase()}_results.json`, "application/json");
  };

  const [phMin, phMax] = CROP_PH_RANGES[crop];
  const [, critThresh, critLabel] = CROP_CRITICAL_RULES[crop];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 lg:min-h-screen bg-card border-b lg:border-b-0 lg:border-r border-border p-6 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-green">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">AgriPulse</h2>
            <p className="text-xs text-muted-foreground">Soil Analyzer v1.0</p>
          </div>
        </div>

        <hr className="border-border mb-5" />

        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
          <Wheat className="w-3.5 h-3.5 animate-wiggle" /> Select Crop
        </label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {CROPS.map((c) => (
            <motion.button key={c} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => reAnalyze(c)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                crop === c
                  ? "bg-primary text-primary-foreground shadow-glow-green"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="text-base">{CROP_EMOJIS[c]}</span> {c.charAt(0) + c.slice(1).toLowerCase()}
            </motion.button>
          ))}
        </div>

        {/* Crop profile */}
        <motion.div layout className="bg-muted/50 rounded-xl p-4 mb-5 border border-border/50">
          <p className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-agri-gold animate-spin-slow" />
            {CROP_EMOJIS[crop]} {crop.charAt(0) + crop.slice(1).toLowerCase()} Profile
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ideal pH</span>
              <span className="font-bold text-foreground">{phMin} – {phMax}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Critical Nutrient</span>
              <span className="font-bold text-foreground">{critLabel} &gt; {critThresh}</span>
            </div>
          </div>
        </motion.div>

        <hr className="border-border mb-5" />

        {/* Upload */}
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
          <FileSpreadsheet className="w-3.5 h-3.5 animate-bounce-gentle" /> Upload CSV
        </label>
        <motion.label whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl py-3 cursor-pointer transition-colors text-sm shadow-glow-green">
          <Upload className="w-4 h-4" /> Choose File
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </motion.label>
        {fileName && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground mt-2 truncate flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> {fileName}
          </motion.p>
        )}

        <hr className="border-border my-5" />

        <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
          <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> CSV Format
          </p>
          <pre className="text-[10px] text-primary font-mono leading-relaxed">
soil_id,nitrogen,phosphorus,potassium,ph{"\n"}S01,18,12,140,6.2{"\n"}S02,35,20,180,5.3
          </pre>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-5 lg:p-8 overflow-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 lg:p-10 mb-8 relative overflow-hidden"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <Leaf key={i} className="absolute text-primary-foreground"
                style={{
                  top: `${10 + i * 15}%`, left: `${60 + i * 7}%`,
                  width: `${20 + i * 5}px`, opacity: 0.3,
                  transform: `rotate(${i * 45}deg)`,
                }} />
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <h1 className="text-3xl lg:text-5xl font-display font-extrabold text-primary-foreground drop-shadow-lg">
                AgriPulse
              </h1>
            </div>
            <p className="text-primary-foreground/80 text-sm lg:text-base font-medium max-w-lg">
              AI-Powered Soil Nutrient Analyzer — Know your soil, feed your crop, grow more.
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-agri-red-pale border border-agri-red/20 text-agri-red rounded-xl p-4 mb-6 text-sm font-semibold flex items-center gap-2">
            <XOctagon className="w-5 h-5 animate-pulse-scale shrink-0" /> {error}
          </motion.div>
        )}

        {!results ? <LandingContent /> : (
          <>
            {/* Summary header */}
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary animate-bounce-gentle" />
                  Analysis Results
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <strong className="text-primary">{results.length}</strong> sample(s) · {CROP_EMOJIS[crop]} {crop} · <span className="text-muted-foreground">{fileName}</span>
                </p>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <MetricCard icon={<Wheat className="w-5 h-5 text-agri-gold animate-wiggle" />} label="Crop" value={crop.charAt(0) + crop.slice(1).toLowerCase()} />
              <MetricCard icon={<TrendingUp className="w-5 h-5 text-primary animate-bounce-gentle" />} label="Avg Score" value={`${avgScore}/100`} />
              <MetricCard icon={<CheckCircle2 className="w-5 h-5 text-agri-green animate-float" />} label="Healthy"
                value={`${results.filter((r) => r.health_status === "Healthy").length}/${results.length}`} />
              <MetricCard icon={<AlertCircle className="w-5 h-5 text-agri-red animate-pulse-scale" />} label="Critical"
                value={`${results.filter((r) => r.health_status === "Critical").length}/${results.length}`} />
            </div>

            <hr className="border-border mb-5" />

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground mr-1">Filter:</span>
              {(["All", "Healthy", "Deficient", "Critical"] as const).map((f) => (
                <motion.button key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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

            <AnimatePresence mode="popLayout">
              {filtered && filtered.length > 0 ? (
                filtered.map((r, i) => <ResultCard key={r.soil_id} result={r} index={i} />)
              ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm py-8 text-center">
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
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadCSV}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3.5 hover:bg-primary/90 transition-colors shadow-glow-green">
                <FileSpreadsheet className="w-4 h-4" /> Download CSV
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadJSON}
                className="flex items-center justify-center gap-2 bg-foreground/10 text-foreground font-bold rounded-xl py-3.5 hover:bg-foreground/15 transition-colors border border-border">
                <FileJson className="w-4 h-4" /> Download JSON
              </motion.button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.02 }}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-display font-extrabold text-foreground">{value}</p>
    </motion.div>
  );
}

function LandingContent() {
  const steps = [
    { Icon: Upload, title: "Upload CSV", desc: "Upload your soil test file with soil_id, nitrogen, phosphorus, potassium, ph", color: "text-agri-green", bg: "bg-agri-green-pale", anim: "animate-bounce-gentle" },
    { Icon: Leaf, title: "Select Crop", desc: "Pick Tomato, Wheat, Rice, or Maize from the sidebar", color: "text-agri-cyan", bg: "bg-agri-green-pale", anim: "animate-float" },
    { Icon: BarChart3, title: "Get Results", desc: "See suitability scores, health status, and fertilizer recommendations", color: "text-agri-gold", bg: "bg-agri-gold-pale", anim: "animate-wiggle" },
  ];

  return (
    <>
      <h2 className="text-xl font-display font-bold text-foreground mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary animate-pulse-scale" />
        How to Use AgriPulse
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: "spring" }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-card border border-border/50 rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all">
            <motion.div className={`w-14 h-14 rounded-2xl ${s.bg} mx-auto mb-4 flex items-center justify-center`}>
              <s.Icon className={`w-7 h-7 ${s.color} ${s.anim}`} />
            </motion.div>
            <p className="font-bold text-sm text-foreground mb-1.5">Step {i + 1}: {s.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary animate-wiggle" />
        Health Status Guide
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Healthy", range: "Score ≥ 80", desc: "Soil is in great condition. No action needed.", Icon: CheckCircle2, color: "text-agri-green", bg: "bg-agri-green-pale", anim: "animate-bounce-gentle" },
          { label: "Deficient", range: "Score 50–79", desc: "Some nutrients are low. Apply recommended fertilizers.", Icon: AlertCircle, color: "text-agri-amber", bg: "bg-agri-gold-pale", anim: "animate-wiggle" },
          { label: "Critical", range: "Score < 50", desc: "Multiple problems found. Immediate action required.", Icon: XOctagon, color: "text-agri-red", bg: "bg-agri-red-pale", anim: "animate-pulse-scale" },
        ].map((h, i) => (
          <motion.div key={i} whileHover={{ y: -3 }}
            className={`${h.bg} rounded-xl p-5 text-center border border-border/30 shadow-card`}>
            <h.Icon className={`w-8 h-8 ${h.color} ${h.anim} mx-auto mb-2`} />
            <p className={`font-extrabold text-sm ${h.color} mb-0.5`}>{h.label}</p>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{h.range}</p>
            <p className="text-xs text-muted-foreground">{h.desc}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
        <Beaker className="w-5 h-5 text-primary animate-float" />
        Scoring Reference
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RefTable title="Nutrient Thresholds" icon={<Leaf className="w-3.5 h-3.5 text-agri-green" />}
          headers={["Nutrient", "Min", "Fertilizer"]}
          rows={[["Nitrogen", "20", "Urea"], ["Phosphorus", "15", "DAP"], ["Potassium", "150", "MOP"]]} />
        <RefTable title="Ideal pH per Crop" icon={<Beaker className="w-3.5 h-3.5 text-agri-cyan" />}
          headers={["Crop", "Min", "Max"]}
          rows={[["Tomato", "6.0", "7.0"], ["Wheat", "6.0", "7.5"], ["Rice", "5.0", "6.5"], ["Maize", "5.8", "7.0"]]} />
        <RefTable title="Score Penalties" icon={<AlertCircle className="w-3.5 h-3.5 text-agri-red" />}
          headers={["Condition", "Penalty"]}
          rows={[["pH out of range", "-20"], ["Each nutrient low", "-15"], ["Critical nutrient", "-10"]]} />
      </div>
    </>
  );
}

function RefTable({ title, icon, headers, rows }: { title: string; icon: React.ReactNode; headers: string[]; rows: string[][] }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-2.5 bg-muted/50 border-b border-border/50 flex items-center gap-2">
        {icon}
        <p className="font-bold text-xs text-foreground">{title}</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            {headers.map((h) => <th key={h} className="px-3 py-2 text-left text-primary font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
              {r.map((c, j) => <td key={j} className="px-3 py-2 text-muted-foreground">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

export default Index;
