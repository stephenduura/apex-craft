import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import FXRateCard from "@/components/FXRateCard";
import TransactionList from "@/components/TransactionList";
import BottomNav from "@/components/BottomNav";
import FundWithdrawDialog from "@/components/FundWithdrawDialog";
import { useWallets } from "@/hooks/useWallets";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Index = () => {
  const { data: wallets, isLoading } = useWallets();
  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [dialogCurrency, setDialogCurrency] = useState("NGN");

  // Ensure wallets exist for pre-trigger users
  useEffect(() => {
    supabase.functions.invoke("init-wallets").catch(() => {});
  }, []);

  const ngnWallet = wallets?.find((w) => w.currency === "NGN");
  const usdWallet = wallets?.find((w) => w.currency === "USD");

  const openFund = (currency: string) => { setDialogCurrency(currency); setFundOpen(true); };
  const openWithdraw = (currency: string) => { setDialogCurrency(currency); setWithdrawOpen(true); };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4">
        <AppHeader />

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            <div className="snap-center">
              <WalletCard
                currency="USD"
                balance={usdWallet?.balance ?? 0}
                symbol="$"
                label="USD Wallet"
                isLoading={isLoading}
                onFund={() => openFund("USD")}
                onWithdraw={() => openWithdraw("USD")}
              />
            </div>
            <div className="snap-center">
              <WalletCard
                currency="NGN"
                balance={ngnWallet?.balance ?? 0}
                symbol="₦"
                label="Naira Wallet"
                isLoading={isLoading}
                onFund={() => openFund("NGN")}
                onWithdraw={() => openWithdraw("NGN")}
              />
            </div>
          </div>
        </motion.section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
          <QuickActions onFund={() => openFund("NGN")} onWithdraw={() => openWithdraw("NGN")} />
        </section>

        <section className="mt-6">
          <FXRateCard />
        </section>

        <section className="mt-6">
          <TransactionList limit={5} />
        </section>
      </div>

      <BottomNav />

      <FundWithdrawDialog open={fundOpen} onClose={() => setFundOpen(false)} mode="fund" currency={dialogCurrency} />
      <FundWithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} mode="withdraw" currency={dialogCurrency} />
    </div>
  );
};

export default Index;
