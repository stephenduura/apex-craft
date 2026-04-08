import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SendMoneyDialogProps {
  open: boolean;
  onClose: () => void;
}

const SendMoneyDialog = ({ open, onClose }: SendMoneyDialogProps) => {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const symbol = currency === "USD" ? "$" : "₦";
  const presets = currency === "USD" ? [10, 25, 50, 100] : [1000, 5000, 10000, 50000];

  const handleSend = async () => {
    const num = parseFloat(amount);
    if (!email || !num || num <= 0) {
      toast.error("Enter recipient email and valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-money", {
        body: { recipient_email: email, amount: num, currency, description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      setTimeout(() => {
        resetAndClose();
      }, 1800);
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setEmail("");
    setAmount("");
    setDescription("");
    setSuccess(false);
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
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-elevated max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">Send Money</h2>
                <p className="text-xs text-muted-foreground font-body">Transfer to another user</p>
              </div>
            </div>
            <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {success ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-8 gap-4">
              <CheckCircle2 className="w-16 h-16 text-success" />
              <p className="text-lg font-semibold font-display text-foreground">Sent! {symbol}{parseFloat(amount).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground font-body">to {email}</p>
            </motion.div>
          ) : (
            <>
              {/* Recipient */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground font-body mb-1.5 block">Recipient Email</label>
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Currency */}
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

              {/* Amount */}
              <div className="bg-muted/50 rounded-2xl p-5 mb-3 text-center">
                <p className="text-xs text-muted-foreground font-body mb-2">Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold font-display text-foreground">{symbol}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl font-bold font-display text-foreground bg-transparent outline-none text-center w-36"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {presets.map((p) => (
                  <button key={p} onClick={() => setAmount(p.toString())} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium font-body text-foreground hover:bg-border transition-colors">
                    {symbol}{p.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="text-xs text-muted-foreground font-body mb-1.5 block">Note (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={loading || !email || !amount}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-base disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Send ${symbol}${amount ? parseFloat(amount).toLocaleString() : "0"}`}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SendMoneyDialog;
