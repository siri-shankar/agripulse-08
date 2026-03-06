import { motion } from "framer-motion";
import {
  CheckCircle2, AlertCircle, XOctagon, Activity, Beaker, Leaf, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const Reference = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
        {/* Health Status Guide */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-8 flex items-center gap-3"
        >
          <Activity className="w-7 h-7 text-primary animate-wiggle" />
          Health Status Guide
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            {
              label: "Healthy",
              range: "Score ≥ 80",
              desc: "Soil is in great condition. No action needed.",
              Icon: CheckCircle2,
              color: "text-agri-green",
              bg: "bg-agri-green-pale",
              border: "border-agri-green/30",
              anim: "animate-bounce-gentle",
            },
            {
              label: "Deficient",
              range: "Score 50–79",
              desc: "Some nutrients are low. Apply recommended fertilizers.",
              Icon: AlertCircle,
              color: "text-agri-amber",
              bg: "bg-agri-gold-pale",
              border: "border-agri-gold/30",
              anim: "animate-wiggle",
            },
            {
              label: "Critical",
              range: "Score < 50",
              desc: "Multiple problems found. Immediate action required.",
              Icon: XOctagon,
              color: "text-agri-red",
              bg: "bg-agri-red-pale",
              border: "border-agri-red/30",
              anim: "animate-pulse-scale",
            },
          ].map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`${h.bg} rounded-2xl p-6 text-center border ${h.border} shadow-card`}
            >
              <h.Icon className={`w-10 h-10 ${h.color} ${h.anim} mx-auto mb-3`} />
              <p className={`font-extrabold text-lg ${h.color} mb-1`}>{h.label}</p>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{h.range}</p>
              <p className="text-sm text-muted-foreground">{h.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Scoring Reference */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-8 flex items-center gap-3"
        >
          <Beaker className="w-7 h-7 text-primary animate-float" />
          Scoring Reference
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          <RefTable
            title="Nutrient Thresholds"
            icon={<Leaf className="w-4 h-4 text-agri-green" />}
            headers={["Nutrient", "Min", "Fertilizer"]}
            rows={[
              ["Nitrogen", "20", "Urea"],
              ["Phosphorus", "15", "DAP"],
              ["Potassium", "150", "MOP"],
            ]}
          />
          <RefTable
            title="Ideal pH per Crop"
            icon={<Beaker className="w-4 h-4 text-agri-cyan" />}
            headers={["Crop", "Min", "Max"]}
            rows={[
              ["Tomato", "6.0", "7.0"],
              ["Wheat", "6.0", "7.5"],
              ["Rice", "5.0", "6.5"],
              ["Maize", "5.8", "7.0"],
            ]}
          />
          <RefTable
            title="Score Penalties"
            icon={<AlertCircle className="w-4 h-4 text-agri-red" />}
            headers={["Condition", "Penalty"]}
            rows={[
              ["pH out of range", "-20"],
              ["Each nutrient low", "-15"],
              ["Critical nutrient", "-10"],
            ]}
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl px-8 py-4 text-lg shadow-glow-green hover:bg-primary/90 transition-colors"
            >
              Upload Your CSV
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

function RefTable({
  title,
  icon,
  headers,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  headers: string[];
  rows: string[][];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-card"
    >
      <div className="px-4 py-3 bg-muted/50 border-b border-border/50 flex items-center gap-2">
        {icon}
        <p className="font-bold text-sm text-foreground">{title}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-primary font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

export default Reference;
