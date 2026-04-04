import BottomNav from "@/components/BottomNav";
import VirtualCard from "@/components/VirtualCard";
import { motion } from "framer-motion";
import { Plus, Settings } from "lucide-react";

const Cards = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-foreground">Virtual Cards</h1>
          <button className="p-2.5 rounded-xl bg-card shadow-card border border-border">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <VirtualCard />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 gap-3"
        >
          <div className="p-4 rounded-2xl bg-card shadow-card border border-border">
            <p className="text-xs text-muted-foreground font-body">This Month</p>
            <p className="text-xl font-bold font-display text-foreground mt-1">$234.50</p>
            <p className="text-[10px] text-success font-medium mt-1">12 transactions</p>
          </div>
          <div className="p-4 rounded-2xl bg-card shadow-card border border-border">
            <p className="text-xs text-muted-foreground font-body">Card Limit</p>
            <p className="text-xl font-bold font-display text-foreground mt-1">$5,000</p>
            <div className="mt-2 w-full h-1.5 rounded-full bg-muted">
              <div className="h-full w-[15%] rounded-full bg-accent" />
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium font-body">Create New Card</span>
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Cards;
