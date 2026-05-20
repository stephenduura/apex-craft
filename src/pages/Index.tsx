import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import FXRateCard from "@/components/FXRateCard";
import TransactionList from "@/components/TransactionList";
import BottomNav from "@/components/BottomNav";
import FundWithdrawDialog from "@/components/FundWithdrawDialog";
import SendMoneyDialog from "@/components/SendMoneyDialog";
import CreatePaymentLinkDialog from "@/components/CreatePaymentLinkDialog";
import { useWallets } from "@/hooks/useWallets";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Index = () => {
  const { data: wallets, isLoading } = useWallets();
  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [dialogCurrency, setDialogCurrency] = useState("NGN");

  useEffect(() => {
    supabase.functions.invoke("init-wallets").catch(() => {});
  }, []);

  const ngnWallet = wallets?.find((w) => w.currency === "NGN");
  const usdWallet = wallets?.find((w) => w.currency === "USD");

  const openFund = (currency: string) => { setDialogCurrency(currency); setFundOpen(true); };
  const openWithdraw = (currency: string) => { setDialogCurrency(currency); setWithdrawOpen(true); };

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-12">
      <div className="app-container">
        <AppHeader />

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="mt-4 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              {/* Mobile: snap carousel. sm+: grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <WalletCard currency="USD" balance={usdWallet?.balance ?? 0} symbol="$" label="USD Wallet" isLoading={isLoading} onFund={() => openFund("USD")} onWithdraw={() => openWithdraw("USD")} />
                <WalletCard currency="NGN" balance={ngnWallet?.balance ?? 0} symbol="₦" label="Naira Wallet" isLoading={isLoading} onFund={() => openFund("NGN")} onWithdraw={() => openWithdraw("NGN")} />
              </div>
            </motion.section>

            <section>
              <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
              <QuickActions
                onFund={() => openFund("NGN")}
                onWithdraw={() => openWithdraw("NGN")}
                onSend={() => setSendOpen(true)}
                onPaymentLink={() => setLinkOpen(true)}
              />
            </section>

            <section className="lg:hidden"><FXRateCard /></section>
            <section><TransactionList limit={5} /></section>
          </div>

          <aside className="hidden lg:block space-y-6">
            <FXRateCard />
          </aside>
        </div>
      </div>

      <BottomNav />

      <FundWithdrawDialog open={fundOpen} onClose={() => setFundOpen(false)} mode="fund" currency={dialogCurrency} />
      <FundWithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} mode="withdraw" currency={dialogCurrency} />
      <SendMoneyDialog open={sendOpen} onClose={() => setSendOpen(false)} />
      <CreatePaymentLinkDialog open={linkOpen} onClose={() => setLinkOpen(false)} />
    </div>
  );
};

export default Index;
