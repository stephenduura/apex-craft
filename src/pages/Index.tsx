import AppHeader from "@/components/AppHeader";
import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import FXRateCard from "@/components/FXRateCard";
import TransactionList from "@/components/TransactionList";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4">
        <AppHeader />

        {/* Wallet Cards */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            <div className="snap-center">
              <WalletCard
                currency="USD"
                balance={3750.42}
                symbol="$"
                label="USD Wallet"
                trend={{ value: 12.5, positive: true }}
              />
            </div>
            <div className="snap-center">
              <WalletCard
                currency="NGN"
                balance={1250000}
                symbol="₦"
                label="Naira Wallet"
                trend={{ value: 3.2, positive: true }}
              />
            </div>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
          <QuickActions />
        </section>

        {/* FX Rate */}
        <section className="mt-6">
          <FXRateCard />
        </section>

        {/* Transactions */}
        <section className="mt-6">
          <TransactionList />
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
