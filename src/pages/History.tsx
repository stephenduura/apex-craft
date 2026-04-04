import BottomNav from "@/components/BottomNav";
import TransactionList from "@/components/TransactionList";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";

const History = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Transaction History</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6"
        >
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border shadow-card">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>
          <button className="p-3 rounded-xl bg-card border border-border shadow-card">
            <Filter className="w-4 h-4 text-foreground" />
          </button>
        </motion.div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {["All", "Credits", "Debits", "Conversions", "Cards"].map((filter, i) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap font-body transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <TransactionList />
      </div>
      <BottomNav />
    </div>
  );
};

export default History;
