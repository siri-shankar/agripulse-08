import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, BookOpen, BarChart3, Upload, FlaskConical } from "lucide-react";

const links = [
  { to: "/", label: "How to Use", Icon: BookOpen },
  { to: "/reference", label: "Reference", Icon: FlaskConical },
  { to: "/upload", label: "Upload", Icon: Upload },
  { to: "/analysis", label: "Analysis", Icon: BarChart3 },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-6 flex items-center h-14 gap-6">
        <NavLink to="/" className="flex items-center gap-2 mr-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow-green"
          >
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </motion.div>
          <span className="font-display font-bold text-foreground text-lg hidden sm:inline">
            AgriPulse
          </span>
        </NavLink>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
