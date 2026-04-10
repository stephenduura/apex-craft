import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import AssetWalletCard from "@/components/AssetWalletCard";
import ReceiveAssetDialog from "@/components/ReceiveAssetDialog";
import SwapToNairaDialog from "@/components/SwapToNairaDialog";
import { useDigitalAssets, useAssetTransactions } from "@/hooks/useDigitalAssets";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, ArrowDownLeft, ArrowRightLeft, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Assets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wallets, isLoading } = useDigitalAssets();
  const { data: transactions } = useAssetTransactions(10);
  const [kycLevel, setKycLevel] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<typeof wallets extends (infer T)[] ? T : never | null>(null);

  useEffect(() => {
    const accepted = localStorage.getItem("ovo_digital_assets_terms");
    if (accepted === "true") setTermsAccepted(true);
    else setShowTerms(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("kyc_level, kyc_status").eq("user_id", user.id).single().then(({ data }) => {
      if (data) { setKycLevel(data.kyc_level); setKycStatus(data.kyc_status); }
    });
  }, [user]);

  const acceptTerms = () => {
    localStorage.setItem("ovo_digital_assets_terms", "true");
    setTermsAccepted(true);
    setShowTerms(false);
  };

  const kycRequired = kycLevel < 1 || kycStatus !== "verified";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Digital Assets</h1>
            <p className="text-xs text-muted-foreground font-body">USDT & USDC Stablecoins</p>
          </div>
        </div>

        {/* Terms Modal */}
        <AnimatePresence>
          {showTerms && !termsAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                  <h2 className="text-lg font-bold font-display text-foreground">Regulatory Notice</h2>
                </div>
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-muted-foreground font-body">
                    Digital assets (USDT, USDC) are <strong>not legal tender</strong> in Nigeria and are not regulated by the Central Bank of Nigeria (CBN).
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    OVO Shield facilitates <strong>peer-to-peer (P2P)</strong> stablecoin transactions only. We do not act as a cryptocurrency exchange or custodian.
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    By proceeding, you acknowledge:
                  </p>
                  <ul className="text-xs text-muted-foreground font-body space-y-1 list-disc pl-4">
                    <li>Digital assets carry inherent risks including price volatility</li>
                    <li>You are solely responsible for your transactions</li>
                    <li>KYC verification is mandatory for all digital asset operations</li>
                    <li>Daily swap limits apply per CBN compliance guidelines</li>
                    <li>All transactions are logged for audit and compliance purposes</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowTerms(false); navigate("/"); }}
                    className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium font-body"
                  >
                    Decline
                  </button>
                  <button
                    onClick={acceptTerms}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium font-body"
                  >
                    I Understand
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KYC Gate */}
        {kycRequired && termsAccepted && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold font-display text-foreground mb-2">Identity Verification Required</h2>
            <p className="text-sm text-muted-foreground font-body mb-6">
              Complete your KYC verification to access digital assets. This is required by Nigerian financial regulations.
            </p>
            <button onClick={() => navigate("/kyc")} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium font-body">
              Verify Identity
            </button>
          </motion.div>
        )}

        {/* Main content */}
        {!kycRequired && termsAccepted && (
          <>
            {/* CBN Notice Banner */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10 mb-6">
              <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground font-body">
                P2P OTC stablecoin service. Not a crypto exchange. All swaps are subject to daily limits and compliance checks.
              </p>
            </div>

            {/* Wallet cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
              {isLoading ? (
                <div className="flex gap-4">
                  <div className="h-40 min-w-[280px] rounded-2xl bg-muted animate-pulse" />
                  <div className="h-40 min-w-[280px] rounded-2xl bg-muted animate-pulse" />
                </div>
              ) : wallets && wallets.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="snap-center">
                      <AssetWalletCard
                        wallet={wallet}
                        onReceive={() => { setSelectedWallet(wallet); setReceiveOpen(true); }}
                        onSwap={() => setSwapOpen(true)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-body mb-4">No digital assets yet</p>
                  <button
                    onClick={() => { setSelectedWallet(null); setReceiveOpen(true); }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium font-body"
                  >
                    Receive Your First {"{"}Asset{"}"}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => { setSelectedWallet(wallets?.[0] ?? null); setReceiveOpen(true); }}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold font-display text-foreground">Receive</p>
                  <p className="text-[10px] text-muted-foreground font-body">Get USDT/USDC</p>
                </div>
              </button>
              <button
                onClick={() => setSwapOpen(true)}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold font-display text-foreground">Swap to ₦</p>
                  <p className="text-[10px] text-muted-foreground font-body">Convert to Naira</p>
                </div>
              </button>
            </div>

            {/* Recent transactions */}
            <div>
              <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3 uppercase tracking-wider">Recent Asset Activity</h3>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.type === "receive" ? "bg-emerald-500/10" : "bg-accent/10"
                        }`}>
                          {tx.type === "receive" ? (
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowRightLeft className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium font-body text-foreground">
                            {tx.type === "receive" ? `Received ${tx.asset}` : `${tx.asset} → NGN`}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-body">
                            {format(new Date(tx.created_at), "MMM dd, HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold font-display ${tx.type === "receive" ? "text-emerald-600" : "text-foreground"}`}>
                          {tx.type === "receive" ? "+" : "-"}{tx.amount.toFixed(2)} {tx.asset}
                        </p>
                        {tx.ngn_amount && (
                          <p className="text-[10px] text-muted-foreground font-body">₦{tx.ngn_amount.toLocaleString()}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground font-body">No transactions yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />

      <ReceiveAssetDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        wallet={selectedWallet}
        defaultAsset="USDT"
      />
      <SwapToNairaDialog
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        wallets={wallets ?? []}
      />
    </div>
  );
};

export default Assets;
