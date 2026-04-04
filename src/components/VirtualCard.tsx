import { motion } from "framer-motion";
import { Shield, Snowflake, Copy } from "lucide-react";

const VirtualCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6 gradient-navy shadow-wallet"
    >
      {/* Card shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
      
      {/* Decorative circles */}
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-primary-foreground/10" />
      <div className="absolute top-6 right-6 w-16 h-16 rounded-full border border-primary-foreground/10" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-sm font-display font-semibold text-primary-foreground">OVO Shield</span>
          </div>
          <span className="text-xs text-primary-foreground/60 font-body">Virtual • USD</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-lg font-display font-medium text-primary-foreground tracking-[0.2em]">
              •••• •••• •••• 4829
            </p>
            <button className="p-1 rounded hover:bg-primary-foreground/10 transition-colors">
              <Copy className="w-3.5 h-3.5 text-primary-foreground/40" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-primary-foreground/40 font-body uppercase tracking-wider">Card Holder</p>
            <p className="text-sm text-primary-foreground font-medium font-body">OVO SHIELD USER</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-primary-foreground/40 font-body uppercase tracking-wider">Expires</p>
            <p className="text-sm text-primary-foreground font-medium font-body">12/28</p>
          </div>
          <button className="p-2 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
            <Snowflake className="w-4 h-4 text-primary-foreground/70" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VirtualCard;
