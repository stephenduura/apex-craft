import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, ArrowDown, Loader2, CheckCircle2, Clock, Info, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useFXRate } from "@/hooks/useFXRates";
import { useWallets } from "@/hooks/useWallets";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const LOCK_DURATION = 30; // seconds

const Convert = () => {
  const [fromAmount, setFromAmount] = useState("");
  const [direction, setDirection] = useState<"ngnToUsd" | "usdToNgn">("ngnToUsd");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [lockedRate, setLockedRate] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const fromCurrency = direction === "ngnToUsd" ? "NGN" : "USD";
  const toCurrency = direction === "ngnToUsd" ? "USD" : "NGN";

  const { rate: fxRate, isLoading: rateLoading } = useFXRate(fromCurrency, toCurrency);
  const { data: wallets } = useWallets();

  const fromWallet = wallets?.find(w => w.currency === fromCurrency);
  const effectiveRate = lockedRate ?? (fxRate?.effective_rate ?? 0);
  const spreadPercent = fxRate?.spread_percent ?? 0;
  const rawAmount = parseFloat(fromAmount) || 0;
  const converted = rawAmount * effectiveRate;
  const fee = rawAmount * spreadPercent / 100;
  const fromSymbol = fromCurrency === "USD" ? "$" : "₦";
  const toSymbol = toCurrency === "USD" ? "$" : "₦";

  // Rate lock countdown
  useEffect(() => {
    if (lockTimer <= 0) {
      setLockedRate(null);
      return;
    }
    const interval = setInterval(() => setLockTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [lockTimer]);

  const handleLockRate = useCallback(() => {
    if (fxRate) {
      setLockedRate(fxRate.effective_rate);
      setLockTimer(LOCK_DURATION);
      toast.success("Rate locked for 30 seconds");
    }
  }, [fxRate]);

  const handleSwap = () => {
    setDirection(d => d === "ngnToUsd" ? "usdToNgn" : "ngnToUsd");
    setFromAmount("");
    setLockedRate(null);
    setLockTimer(0);
  };

  const handleConvert = async () => {
    if (!rawAmount || rawAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (fromWallet && rawAmount > fromWallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("convert-currency", {
        body: { from_currency: fromCurrency, to_currency: toCurrency, amount: rawAmount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      setTimeout(() => {
        setSuccess(false);
        setFromAmount("");
        setLockedRate(null);
        setLockTimer(0);
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Convert Currency</h1>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-16 gap-4"
            >
              <CheckCircle2 className="w-20 h-20 text-success" />
              <p className="text-xl font-bold font-display text-foreground">Conversion Complete!</p>
              <p className="text-sm text-muted-foreground font-body">
                {fromSymbol}{rawAmount.toLocaleString()} → {toSymbol}{converted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="space-y-3">
                {/* From */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-card shadow-card border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-body">From</p>
                    {fromWallet && (
                      <p className="text-xs text-muted-foreground font-body">
                        Balance: {fromSymbol}{fromWallet.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="text-2xl font-bold font-display text-foreground bg-transparent outline-none w-full"
                    />
                    <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-body flex-shrink-0">
                      {fromSymbol} {fromCurrency}
                    </span>
                  </div>
                  {fromWallet && rawAmount > 0 && (
                    <button
                      onClick={() => setFromAmount(fromWallet.balance.toString())}
                      className="mt-2 text-xs text-accent font-medium font-body hover:underline"
                    >
                      Use Max
                    </button>
                  )}
                </motion.div>

                {/* Swap */}
                <div className="flex justify-center -my-1 relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSwap}
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
                      {converted > 0 ? converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </p>
                    <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-body flex-shrink-0">
                      {toSymbol} {toCurrency}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Rate & Fee Breakdown */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 space-y-3"
              >
                {/* Rate card */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-accent flex-shrink-0" />
                      <div>
                        {rateLoading ? (
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        ) : (
                          <p className="text-sm font-medium text-foreground font-body">
                            1 {fromCurrency} = {toSymbol}{effectiveRate.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-body">
                          Includes {spreadPercent}% spread
                        </p>
                      </div>
                    </div>

                    {/* Lock button */}
                    {lockTimer > 0 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs font-semibold font-body">{lockTimer}s</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleLockRate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium font-body hover:bg-accent/20 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        Lock Rate
                      </button>
                    )}
                  </div>

                  {/* Fee breakdown */}
                  {rawAmount > 0 && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-xs font-body">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Info className="w-3 h-3" /> Spread Fee
                        </span>
                        <span className="text-foreground font-medium">
                          {fromSymbol}{fee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-body">
                        <span className="text-muted-foreground">You send</span>
                        <span className="text-foreground font-medium">{fromSymbol}{rawAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-body">
                        <span className="text-muted-foreground">You receive</span>
                        <span className="text-success font-semibold">
                          {toSymbol}{converted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConvert}
                disabled={loading || !rawAmount || rawAmount <= 0}
                className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base font-display shadow-wallet hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  `Convert ${fromSymbol}${rawAmount > 0 ? rawAmount.toLocaleString() : "0"} → ${toCurrency}`
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default Convert;
