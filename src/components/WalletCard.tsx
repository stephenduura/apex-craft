import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  currency: string;
  balance: number;
  symbol: string;
  label: string;
  trend?: { value: number; positive: boolean };
  onFund?: () => void;
  onWithdraw?: () => void;
  isLoading?: boolean;
}

const WalletCard = ({ currency, balance, symbol, label, trend, onFund, onWithdraw, isLoading }: WalletCardProps) => {
  const [visible, setVisible] = useState(true);
  const isUSD = currency === "USD";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl p-6 min-w-[280px] flex-shrink-0 ${
        isUSD ? "gradient-navy shadow-wallet" : "bg-card shadow-card border border-border"
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
        isUSD ? "bg-accent/20" : "bg-primary/5"
      }`} />
      <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl ${
        isUSD ? "bg-success/10" : "bg-accent/5"
      }`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <span className={`text-sm font-medium font-body ${
            isUSD ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}>{label}</span>
          <button
            onClick={() => setVisible(!visible)}
            className={`p-1.5 rounded-lg transition-colors ${
              isUSD ? "hover:bg-primary-foreground/10 text-primary-foreground/60" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <div className="mb-6">
          {isLoading ? (
            <div className="h-9 w-36 rounded-lg bg-muted/30 animate-pulse" />
          ) : (
            <p className={`text-3xl font-bold font-display tracking-tight ${
              isUSD ? "text-primary-foreground" : "text-foreground"
            }`}>
              {visible ? `${symbol}${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "••••••"}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
              <span className={`text-xs ${isUSD ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                vs last month
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onFund}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isUSD
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Fund
          </button>
          <button
            onClick={onWithdraw}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isUSD
                ? "bg-accent/20 hover:bg-accent/30 text-primary-foreground"
                : "bg-accent/10 hover:bg-accent/20 text-accent"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Withdraw
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletCard;
