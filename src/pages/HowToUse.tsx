import { motion } from "framer-motion";
import { Upload, Leaf, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    Icon: Upload,
    title: "Upload CSV",
    desc: "Upload your soil test file with columns: soil_id, nitrogen, phosphorus, potassium, ph",
    color: "text-primary",
    bg: "bg-agri-green-pale",
    anim: "animate-bounce-gentle",
  },
  {
    Icon: Leaf,
    title: "Select Crop",
    desc: "Pick Tomato, Wheat, Rice, or Maize — each has unique nutrient thresholds and pH ranges",
    color: "text-agri-cyan",
    bg: "bg-blue-50",
    anim: "animate-float",
  },
  {
    Icon: BarChart3,
    title: "Get Results",
    desc: "See suitability scores, health status, fertilizer recommendations, and download reports",
    color: "text-agri-gold",
    bg: "bg-agri-gold-pale",
    anim: "animate-wiggle",
  },
];

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <Leaf
              key={i}
              className="absolute text-primary-foreground"
              style={{
                top: `${5 + i * 12}%`,
                left: `${50 + i * 6}%`,
                width: `${18 + i * 4}px`,
                opacity: 0.25,
                transform: `rotate(${i * 40}deg)`,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 lg:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-4xl lg:text-6xl font-display font-extrabold text-primary-foreground drop-shadow-lg">
              AgriPulse
            </h1>
          </motion.div>
          <p className="text-primary-foreground/80 text-lg font-medium max-w-xl mx-auto">
            AI-Powered Soil Nutrient Analyzer — Know your soil, feed your crop, grow more.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl lg:text-3xl font-display font-bold text-foreground text-center mb-12 flex items-center justify-center gap-3"
        >
          <Sparkles className="w-6 h-6 text-primary animate-pulse-scale" />
          How to Use AgriPulse
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, type: "spring" }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="bg-card border border-border/50 rounded-2xl p-8 text-center shadow-card hover:shadow-card-hover transition-all"
            >
              <motion.div
                className={`w-16 h-16 rounded-2xl ${s.bg} mx-auto mb-5 flex items-center justify-center`}
              >
                <s.Icon className={`w-8 h-8 ${s.color} ${s.anim}`} />
              </motion.div>
              <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                Step {i + 1}
              </div>
              <p className="font-bold text-lg text-foreground mb-2">{s.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/reference">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-8 py-4 text-lg shadow-glow-green hover:bg-primary/90 transition-colors"
            >
              Scoring Reference
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
