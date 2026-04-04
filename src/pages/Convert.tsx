import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowDown } from "lucide-react";
import { useState } from "react";

const Convert = () => {
  const [fromAmount, setFromAmount] = useState("500,000");
  const [direction, setDirection] = useState<"ngnToUsd" | "usdToNgn">("ngnToUsd");
  const rate = 1580;
  const rawAmount = parseInt(fromAmount.replace(/,/g, "")) || 0;
  const converted = direction === "ngnToUsd" ? rawAmount / rate : rawAmount * rate;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Convert Currency</h1>

        <div className="space-y-3">
          {/* From */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-card shadow-card border border-border"
          >
            <p className="text-xs text-muted-foreground font-body mb-2">From</p>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-2xl font-bold font-display text-foreground bg-transparent outline-none w-full"
              />
              <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-body flex-shrink-0">
                {direction === "ngnToUsd" ? "₦ NGN" : "$ USD"}
              </span>
            </div>
          </motion.div>

          {/* Swap */}
          <div className="flex justify-center -my-1 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDirection(d => d === "ngnToUsd" ? "usdToNgn" : "ngnToUsd")}
              className="w-10 h-10 rounded-full bg-accent text-accent-foreground shadow-elevated flex items-center justify-center"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          </div>

          {/* To */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-card shadow-card border border-border"
          >
            <p className="text-xs text-muted-foreground font-body mb-2">To</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold font-display text-foreground">
                {converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-body flex-shrink-0">
                {direction === "ngnToUsd" ? "$ USD" : "₦ NGN"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Rate info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 rounded-xl bg-muted/50 flex items-center gap-3"
        >
          <ArrowLeftRight className="w-4 h-4 text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground font-body">1 USD = ₦{rate.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground font-body">Rate includes 0.5% spread</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base font-display shadow-wallet hover:bg-primary/90 transition-colors"
        >
          Convert Now
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Convert;
