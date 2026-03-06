import { useState, useCallback } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Filter } from "lucide-react";
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
      <aside className="w-full lg:w-72 lg:min-h-screen bg-card border-b lg:border-b-0 lg:border-r border-border p-5 shrink-0">
        <h2 className="text-lg font-display font-bold text-primary mb-1">⚙️ Controls</h2>
        <hr className="border-border mb-4" />

        <label className="text-sm font-bold text-primary mb-1 block">🌿 Select Your Crop</label>
        <select
          value={crop}
          onChange={(e) => reAnalyze(e.target.value as CropType)}
          className="w-full bg-secondary border-2 border-primary rounded-lg px-3 py-2 text-foreground font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {CROPS.map((c) => <option key={c} value={c}>{CROP_EMOJIS[c]} {c}</option>)}
        </select>

        <div className="bg-secondary border-2 border-primary rounded-xl p-4 mb-4">
          <p className="font-extrabold text-primary text-sm mb-2">{CROP_EMOJIS[crop]} {crop} — Crop Profile</p>
          <p className="text-xs text-secondary-foreground">🧪 <strong className="text-accent">Ideal pH:</strong> {phMin} – {phMax}</p>
          <p className="text-xs text-secondary-foreground">⚡ <strong className="text-accent">Critical:</strong> {critLabel} &gt; {critThresh}</p>
        </div>

        <hr className="border-border mb-4" />

        <label className="text-sm font-bold text-primary mb-1 block">📂 Upload Soil CSV</label>
        <label className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl py-2.5 cursor-pointer transition-colors text-sm">
          <Upload className="w-4 h-4" /> Choose File
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>
        {fileName && <p className="text-xs text-muted-foreground mt-1 truncate">📄 {fileName}</p>}

        <hr className="border-border my-4" />
        <p className="text-xs font-bold text-primary mb-1">📋 Required CSV Format:</p>
        <pre className="bg-secondary text-agri-cyan text-xs rounded-lg p-2 overflow-x-auto">
          soil_id,nitrogen,phosphorus,potassium,ph{"\n"}S01,18,12,140,6.2{"\n"}S02,35,20,180,5.3
        </pre>
        <p className="text-xs text-muted-foreground mt-6">AgriPulse v1.0 · Hackathon Demo 🌱</p>
      </aside>

      {/* Main */}
      <main className="flex-1 p-5 lg:p-8 overflow-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 lg:p-10 mb-8 border-2 border-primary"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-primary-foreground mb-2 drop-shadow-lg">
            🌾 AgriPulse
          </h1>
          <p className="text-primary-foreground/80 text-base font-semibold">
            AI-Powered Soil Nutrient Analyzer · Know your soil. Feed your crop. Grow more.
          </p>
        </motion.div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-xl p-4 mb-6 text-sm font-semibold">
            ❌ {error}
          </div>
        )}

        {!results ? <LandingContent /> : (
          <>
            {/* Summary */}
            <h2 className="text-xl font-display font-bold text-primary mb-1">
              📋 Analysis Results — {CROP_EMOJIS[crop]} {crop}
            </h2>
            <p className="text-sm text-secondary-foreground mb-4">
              <strong className="text-accent">{results.length}</strong> sample(s) from <code className="bg-secondary text-agri-cyan px-1 rounded">{fileName}</code>
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <MetricCard label="🌾 Crop" value={crop} />
              <MetricCard label="📊 Avg Score" value={`${avgScore} / 100`} />
              <MetricCard label="✅ Healthy" value={`${results.filter((r) => r.health_status === "Healthy").length} / ${results.length}`} />
              <MetricCard label="🚨 Critical" value={`${results.filter((r) => r.health_status === "Critical").length} / ${results.length}`} />
            </div>

            <hr className="border-border mb-4" />

            {/* Filter */}
            <h3 className="text-lg font-display font-bold text-primary mb-2">🔍 Detailed Results</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {(["All", "Healthy", "Deficient", "Critical"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {f === "All" ? "All" : f === "Healthy" ? "Healthy ✅" : f === "Deficient" ? "Deficient ⚠️" : "Critical 🚨"}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {filtered && filtered.length > 0 ? (
                filtered.map((r, i) => <ResultCard key={r.soil_id} result={r} index={i} />)
              ) : (
                <p className="text-muted-foreground text-sm">No samples match this filter.</p>
              )}
            </AnimatePresence>

            <hr className="border-border my-6" />
            <h3 className="text-lg font-display font-bold text-primary mb-3">💾 Download Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={downloadCSV} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" /> Download Summary CSV
              </button>
              <button onClick={downloadJSON} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" /> Download Full JSON
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary border-2 border-primary rounded-xl p-4">
      <p className="text-xs font-bold text-primary mb-1">{label}</p>
      <p className="text-lg font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function LandingContent() {
  const steps = [
    { icon: "📂", title: "Step 1 — Upload CSV", desc: "Upload your soil test file with soil_id, nitrogen, phosphorus, potassium, ph", border: "border-agri-green", bg: "bg-agri-green/5" },
    { icon: "🌿", title: "Step 2 — Select Crop", desc: "Pick Tomato, Wheat, Rice, or Maize", border: "border-agri-cyan", bg: "bg-agri-cyan/5" },
    { icon: "📊", title: "Step 3 — Get Results", desc: "See your soil score, health status, and which fertilizers to apply", border: "border-agri-gold", bg: "bg-agri-gold/5" },
  ];

  return (
    <>
      <h2 className="text-xl font-display font-bold text-primary mb-4">👈 How to Use AgriPulse</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
            className={`${s.bg} border-2 ${s.border} rounded-2xl p-6 text-center`}>
            <div className="text-4xl mb-3">{s.icon}</div>
            <p className="font-extrabold text-sm text-foreground mb-2">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="text-lg font-display font-bold text-primary mb-3">🚦 Health Status Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "🟢 HEALTHY", range: "Score ≥ 80", desc: "Soil is in great condition.", cls: "border-agri-green bg-agri-green/5 text-agri-green" },
          { label: "🟡 DEFICIENT", range: "Score 50–79", desc: "Some nutrients low. Apply fertilizers.", cls: "border-agri-gold bg-agri-gold/5 text-agri-gold" },
          { label: "🔴 CRITICAL", range: "Score < 50", desc: "Multiple problems. Immediate action.", cls: "border-agri-red bg-agri-red/5 text-agri-red" },
        ].map((h, i) => (
          <div key={i} className={`border-2 rounded-xl p-5 text-center ${h.cls}`}>
            <p className="font-extrabold text-base mb-1">{h.label}</p>
            <p className="text-sm font-semibold mb-1">{h.range}</p>
            <p className="text-xs text-muted-foreground">{h.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-display font-bold text-primary mb-3">📚 Scoring Reference</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RefTable title="🌱 Nutrient Thresholds" headers={["Nutrient", "Min", "Fertilizer"]}
          rows={[["Nitrogen", "20", "Urea"], ["Phosphorus", "15", "DAP"], ["Potassium", "150", "MOP"]]} />
        <RefTable title="🧪 Ideal pH per Crop" headers={["Crop", "Min", "Max"]}
          rows={[["Tomato", "6.0", "7.0"], ["Wheat", "6.0", "7.5"], ["Rice", "5.0", "6.5"], ["Maize", "5.8", "7.0"]]} />
        <RefTable title="⚖️ Penalty Points" headers={["Condition", "Penalty"]}
          rows={[["pH out of range", "-20"], ["Each nutrient low", "-15"], ["Critical nutrient", "-10"]]} />
      </div>
    </>
  );
}

function RefTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <p className="font-bold text-sm text-accent px-4 py-2 bg-secondary">{title}</p>
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border">{headers.map((h) => <th key={h} className="px-3 py-2 text-left text-primary font-bold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border last:border-0">{r.map((c, j) => <td key={j} className="px-3 py-2 text-secondary-foreground">{c}</td>)}</tr>)}</tbody>
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
