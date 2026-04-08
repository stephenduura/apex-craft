import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PayLink = () => {
  const { linkId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!linkId) return;
    supabase
      .from("payment_links")
      .select("*")
      .eq("id", linkId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError("Payment link not found");
        else setLink(data);
        setLoading(false);
      });
  }, [linkId]);

  const handlePay = async () => {
    if (!user) {
      navigate(`/login?redirect=/pay/${linkId}`);
      return;
    }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("pay-link", {
        body: { action: "pay", link_id: linkId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPaid(true);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const symbol = link?.currency === "USD" ? "$" : "₦";
  const isExpired = link?.expires_at && new Date(link.expires_at) < new Date();
  const isOwn = link?.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl shadow-elevated p-6"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-base font-semibold font-display text-foreground">{error}</p>
            <button onClick={() => navigate("/")} className="text-sm text-accent font-body">Go home</button>
          </div>
        ) : paid ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="w-14 h-14 text-success" />
            <p className="text-lg font-semibold font-display text-foreground">Payment Sent!</p>
            <p className="text-sm text-muted-foreground font-body">{symbol}{link.amount.toLocaleString()}</p>
            <button onClick={() => navigate("/")} className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-sm">
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Link2 className="w-7 h-7" />
              </div>
              <p className="text-sm text-muted-foreground font-body">Payment Request</p>
              <p className="text-3xl font-bold font-display text-foreground mt-1">
                {symbol}{link.amount.toLocaleString()}
              </p>
              {link.description && (
                <p className="text-sm text-muted-foreground font-body mt-2 text-center">{link.description}</p>
              )}
            </div>

            {link.status === "paid" ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-success font-body">✓ Already paid</p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-destructive font-body">Link expired</p>
              </div>
            ) : isOwn ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground font-body">This is your own payment link</p>
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold font-display text-base disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {paying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Pay ${symbol}${link.amount.toLocaleString()}`}
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PayLink;
