import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Loader2, CheckCircle2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreatePaymentLinkDialog = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkId, setLinkId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const symbol = currency === "USD" ? "$" : "₦";

  const handleCreate = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from("payment_links").insert({
        creator_id: user!.id,
        amount: num,
        currency,
        description: description || null,
      } as any).select().single();

      if (error) throw error;
      setLinkId((data as any).id);
      queryClient.invalidateQueries({ queryKey: ["payment_links"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create link");
    } finally {
      setLoading(false);
    }
  };

  const payUrl = linkId ? `${window.location.origin}/pay/${linkId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(payUrl);
    toast.success("Link copied!");
  };

  const resetAndClose = () => {
    setAmount("");
    setDescription("");
    setLinkId(null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={() => !loading && resetAndClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-elevated"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">Payment Link</h2>
                <p className="text-xs text-muted-foreground font-body">Request money from anyone</p>
              </div>
            </div>
            <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {linkId ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-6 gap-4">
              <CheckCircle2 className="w-14 h-14 text-success" />
              <p className="text-base font-semibold font-display text-foreground">Link Created!</p>
              <div className="w-full bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                <p className="text-xs text-muted-foreground font-body flex-1 truncate">{payUrl}</p>
                <button onClick={copyLink} className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                  <Copy className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-body">Share this link to receive {symbol}{parseFloat(amount).toLocaleString()}</p>
              <button onClick={resetAndClose} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-sm">
                Done
              </button>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {["NGN", "USD"].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCurrency(c); setAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold font-display transition-colors ${
                      currency === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c === "USD" ? "$ USD" : "₦ NGN"}
                  </button>
                ))}
              </div>

              <div className="bg-muted/50 rounded-2xl p-5 mb-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-2">Request Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold font-display text-foreground">{symbol}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl font-bold font-display text-foreground bg-transparent outline-none text-center w-36"
                    inputMode="decimal"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground font-body mb-1.5 block">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !amount}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-base disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Payment Link"}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePaymentLinkDialog;
