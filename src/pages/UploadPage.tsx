import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { motion } from "framer-motion";
import {
  Upload, FileSpreadsheet, HelpCircle, XOctagon, CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import { SoilSample } from "@/lib/soilAnalysis";

const REQUIRED = ["soil_id", "nitrogen", "phosphorus", "potassium", "ph"];

const UploadPage = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [ready, setReady] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setReady(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields?.map((f) => f.toLowerCase().trim()) || [];
        const missing = REQUIRED.filter((r) => !cols.includes(r));
        if (missing.length) {
          setError(`Missing columns: ${missing.join(", ")}`);
          return;
        }
        const rows: SoilSample[] = res.data.map((d: any) => ({
          soil_id: String(d.soil_id || d.Soil_id || d.SOIL_ID || ""),
          nitrogen: Number(d.nitrogen || d.Nitrogen || 0),
          phosphorus: Number(d.phosphorus || d.Phosphorus || 0),
          potassium: Number(d.potassium || d.Potassium || 0),
          ph: Number(d.ph || d.pH || d.PH || 0),
        }));
        // Store in sessionStorage for the analysis page
        sessionStorage.setItem("agripulse_data", JSON.stringify(rows));
        sessionStorage.setItem("agripulse_filename", file.name);
        setRowCount(rows.length);
        setReady(true);
      },
      error: () => {
        setError("Could not read CSV file.");
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">
            Upload Soil Data
          </h1>
          <p className="text-muted-foreground">
            Upload your CSV file to analyze soil health and get fertilizer recommendations.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8">
          {/* Upload area */}
          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-border hover:border-primary rounded-xl py-10 cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50"
          >
            <Upload className="w-10 h-10 text-primary animate-bounce-gentle" />
            <span className="font-bold text-foreground">Click to choose CSV file</span>
            <span className="text-xs text-muted-foreground">or drag and drop</span>
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </motion.label>

          {fileName && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-4 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span className="truncate font-medium">{fileName}</span>
              {ready && (
                <span className="ml-auto flex items-center gap-1 text-agri-green font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {rowCount} samples
                </span>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-agri-red-pale border border-agri-red/20 text-agri-red rounded-xl p-3 text-sm font-semibold flex items-center gap-2"
            >
              <XOctagon className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}

          {ready && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/analysis")}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3.5 shadow-glow-green hover:bg-primary/90 transition-colors"
            >
              Continue to Analysis
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          {/* Format help */}
          <div className="mt-6 bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> Required CSV Format
            </p>
            <pre className="text-xs text-primary font-mono leading-relaxed">
              soil_id,nitrogen,phosphorus,potassium,ph{"\n"}S01,18,12,140,6.2{"\n"}S02,35,20,180,5.3
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadPage;
