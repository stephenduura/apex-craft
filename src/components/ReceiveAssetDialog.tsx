import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { DigitalAssetWallet } from "@/hooks/useDigitalAssets";

interface ReceiveAssetDialogProps {
  open: boolean;
  onClose: () => void;
  wallet?: DigitalAssetWallet | null;
  defaultAsset?: string;
}

const networks = ["TRC20", "ERC20", "BEP20"] as const;

const ReceiveAssetDialog = ({ open, onClose, wallet, defaultAsset = "USDT" }: ReceiveAssetDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [network, setNetwork] = useState<string>(wallet?.network ?? "TRC20");
  const [copied, setCopied] = useState(false);
  const [simAmount, setSimAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const asset = wallet?.asset ?? defaultAsset;
  const address = wallet?.wallet_address;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const simulateReceive = async () => {
    const amt = parseFloat(simAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("receive-asset", {
        body: { asset, network, amount: amt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Received ${amt} ${asset}`);
      queryClient.invalidateQueries({ queryKey: ["digital-asset-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["digital-asset-transactions"] });
      setSimAmount("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to receive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Receive {asset}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network selector */}
          <div>
            <label className="text-xs text-muted-foreground font-body mb-2 block">Network</label>
            <div className="flex gap-2">
              {networks.map((n) => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium font-body transition-colors ${
                    network === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          {address ? (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body mb-2">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground break-all flex-1">{address}</code>
                <button onClick={copyAddress} className="p-2 rounded-lg bg-card hover:bg-accent/10 transition-colors shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body text-center py-4">
              Wallet address will be generated on first receive.
            </p>
          )}

          {/* Minimum deposit notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-body">
              Minimum deposit: 1 {asset}. Only send {asset} on the {network} network. Sending other tokens may result in permanent loss.
            </p>
          </div>

          {/* Simulated receive for demo */}
          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body mb-2">Demo: Simulate Receive</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={simulateReceive}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium font-body disabled:opacity-50"
              >
                {loading ? "..." : "Receive"}
              </button>
            </div>
          </div>

          {/* Compliance notice */}
          <p className="text-[10px] text-muted-foreground font-body text-center">
            Digital assets are not legal tender in Nigeria. OVO Shield acts as a peer-to-peer facilitator only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveAssetDialog;
