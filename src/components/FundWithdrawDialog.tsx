import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownLeft, ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FundWithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "fund" | "withdraw";
  currency?: string;
}

const FundWithdrawDialog = ({ open, onClose, mode, currency = "NGN" }: FundWithdrawDialogProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const queryClient = useQueryClient();

  const symbol = selectedCurrency === "USD" ? "$" : "₦";
  const isFund = mode === "fund";

  const presetAmounts = selectedCurrency === "USD"
    ? [50, 100, 250, 500, 1000]
    : [5000, 10000, 50000, 100000, 500000];

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const fn = isFund ? "fund-wallet" : "withdraw-wallet";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { currency: selectedCurrency, amount: numAmount },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      setTimeout(() => {
        setSuccess(false);
        setAmount("");
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount("");
      setSuccess(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-elevated"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isFund ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
              }`}>
                {isFund ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">
                  {isFund ? "Fund Wallet" : "Withdraw"}
                </h2>
                <p className="text-xs text-muted-foreground font-body">
                  {isFund ? "Add money to your wallet" : "Cash out to bank"}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <CheckCircle2 className="w-16 h-16 text-success" />
              <p className="text-lg font-semibold font-display text-foreground">
                {isFund ? "Funded!" : "Withdrawn!"} {symbol}{parseFloat(amount).toLocaleString()}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Currency Toggle */}
              <div className="flex gap-2 mb-6">
                {["NGN", "USD"].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCurrency(c); setAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold font-display transition-colors ${
                      selectedCurrency === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c === "USD" ? "$ USD" : "₦ NGN"}
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              <div className="bg-muted/50 rounded-2xl p-6 mb-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-2">Enter Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold font-display text-foreground">{symbol}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl font-bold font-display text-foreground bg-transparent outline-none text-center w-40"
                    inputMode="decimal"
                    autoFocus
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex gap-2 flex-wrap mb-6">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p.toString())}
                    className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium font-body text-foreground hover:bg-border transition-colors"
                  >
                    {symbol}{p.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !amount}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-base disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  `${isFund ? "Fund" : "Withdraw"} ${symbol}${amount ? parseFloat(amount).toLocaleString() : "0"}`
                )}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FundWithdrawDialog;
