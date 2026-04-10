import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Clock, ArrowDown, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFXRates } from "@/hooks/useFXRates";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { DigitalAssetWallet } from "@/hooks/useDigitalAssets";

interface SwapToNairaDialogProps {
  open: boolean;
  onClose: () => void;
  wallets: DigitalAssetWallet[];
}

const DAILY_LIMIT = 10000;
const RATE_LOCK_SECONDS = 30;

const SwapToNairaDialog = ({ open, onClose, wallets }: SwapToNairaDialogProps) => {
  const queryClient = useQueryClient();
  const { data: rates } = useFXRates();
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLockTimer, setRateLockTimer] = useState(RATE_LOCK_SECONDS);
  const [rateExpired, setRateExpired] = useState(false);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const asset = selectedWallet?.asset ?? "USDT";
  const rate = rates?.find((r) => r.from_currency === asset && r.to_currency === "NGN");
  const effectiveRate = rate ? parseFloat(String(rate.effective_rate)) : 0;
  const spread = rate ? parseFloat(String(rate.spread_percent)) : 0;
  const amountNum = parseFloat(amount) || 0;
  const ngnAmount = amountNum * effectiveRate;
  const feeAmount = amountNum * spread / 100;

  // Auto-select first wallet
  useEffect(() => {
    if (open && wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [open, wallets, selectedWalletId]);

  // Rate lock countdown
  useEffect(() => {
    if (!open) { setRateLockTimer(RATE_LOCK_SECONDS); setRateExpired(false); return; }
    const interval = setInterval(() => {
      setRateLockTimer((t) => {
        if (t <= 1) { setRateExpired(true); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const refreshRate = () => {
    queryClient.invalidateQueries({ queryKey: ["fx-rates"] });
    setRateLockTimer(RATE_LOCK_SECONDS);
    setRateExpired(false);
  };

  const handleSwap = async () => {
    if (!selectedWallet || amountNum <= 0) { toast.error("Enter a valid amount"); return; }
    if (amountNum > selectedWallet.balance) { toast.error("Insufficient balance"); return; }
    if (rateExpired) { toast.error("Rate expired. Refresh to continue."); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("swap-asset-to-ngn", {
        body: { asset: selectedWallet.asset, amount: amountNum, wallet_id: selectedWallet.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Swapped ${amountNum} ${asset} → ₦${ngnAmount.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ["digital-asset-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["digital-asset-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setAmount("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Swap to Naira</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset selector */}
          <div>
            <label className="text-xs text-muted-foreground font-body mb-2 block">Select Asset</label>
            <div className="flex gap-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium font-body transition-colors ${
                    selectedWalletId === w.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w.asset} ({w.network})
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground font-body">Amount ({asset})</label>
              {selectedWallet && (
                <button
                  onClick={() => setAmount(String(selectedWallet.balance))}
                  className="text-[10px] text-accent font-medium font-body"
                >
                  Max: {selectedWallet.balance.toFixed(2)}
                </button>
              )}
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-lg font-display text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* NGN preview */}
          <div className="bg-muted rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body mb-1">You'll Receive</p>
            <p className="text-2xl font-bold font-display text-foreground">
              ₦{ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Rate info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-body">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground">1 {asset} = ₦{effectiveRate.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-body">
              <span className="text-muted-foreground">Spread</span>
              <span className="text-foreground">{spread}%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-body">
              <span className="text-muted-foreground">Fee (included)</span>
              <span className="text-foreground">{feeAmount.toFixed(2)} {asset}</span>
            </div>
          </div>

          {/* Rate lock timer */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${rateExpired ? "bg-destructive/10 border border-destructive/20" : "bg-accent/10 border border-accent/20"}`}>
            <Clock className={`w-4 h-4 ${rateExpired ? "text-destructive" : "text-accent"}`} />
            {rateExpired ? (
              <div className="flex items-center justify-between flex-1">
                <span className="text-xs text-destructive font-body">Rate expired</span>
                <button onClick={refreshRate} className="text-xs text-accent font-medium font-body">Refresh</button>
              </div>
            ) : (
              <span className="text-xs text-accent font-body">Rate locked for {rateLockTimer}s</span>
            )}
          </div>

          {/* Daily limit */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-body">
              Daily limit: ${DAILY_LIMIT.toLocaleString()} USD equivalent
            </span>
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={loading || rateExpired || amountNum <= 0}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium font-body text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? "Processing..." : `Swap ${asset} to NGN`}
          </button>

          {/* Compliance notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-body">
              This is a peer-to-peer OTC swap. Digital assets are not CBN-regulated currencies. By proceeding, you acknowledge the risks involved in digital asset transactions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapToNairaDialog;
