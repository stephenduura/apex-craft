import { motion } from "framer-motion";
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { useFXRate } from "@/hooks/useFXRates";
import { useNavigate } from "react-router-dom";

const FXRateCard = () => {
  const { rate, isLoading } = useFXRate("USD", "NGN");
  const navigate = useNavigate();

  const effectiveRate = rate?.effective_rate ?? 0;
  const spread = rate?.spread_percent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl p-5 bg-card shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-accent-foreground" />
          </div>
          <h3 className="text-sm font-semibold font-display text-foreground">Live FX Rate</h3>
        </div>
        <div className="flex items-center gap-1 text-success">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold font-display text-foreground">
                ₦{Math.round(effectiveRate).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                per $1 USD • {spread}% spread
              </p>
            </>
          )}
        </div>
        <button
          onClick={() => navigate("/convert")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors font-body"
        >
          Convert Now
        </button>
      </div>
    </motion.div>
  );
};

export default FXRateCard;
