import { Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";

const AppHeader = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center shadow-wallet">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-body">Welcome back,</p>
          <p className="text-base font-semibold font-display text-foreground">Shield User</p>
        </div>
      </div>
      <button className="relative p-2.5 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated transition-shadow">
        <Bell className="w-5 h-5 text-foreground" />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
      </button>
    </motion.header>
  );
};

export default AppHeader;
