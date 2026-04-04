import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, Bitcoin } from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "convert" | "card" | "crypto";
  title: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  positive: boolean;
}

const transactions: Transaction[] = [
  { id: "1", type: "credit", title: "USD Received", description: "From Grey account", amount: "+$1,250.00", currency: "USD", date: "Today, 2:45 PM", positive: true },
  { id: "2", type: "convert", title: "₦ → $ Conversion", description: "Rate: ₦1,580/$1", amount: "-₦790,000", currency: "NGN", date: "Today, 11:30 AM", positive: false },
  { id: "3", type: "card", title: "Card Payment", description: "Netflix Subscription", amount: "-$15.99", currency: "USD", date: "Yesterday", positive: false },
  { id: "4", type: "credit", title: "Wallet Funded", description: "Bank transfer", amount: "+₦500,000", currency: "NGN", date: "Yesterday", positive: true },
  { id: "5", type: "crypto", title: "USDT Deposit", description: "Binance transfer", amount: "+$500.00", currency: "USD", date: "Mar 28", positive: true },
];

const typeIcon: Record<string, typeof ArrowDownLeft> = {
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
  convert: ArrowLeftRight,
  card: CreditCard,
  crypto: Bitcoin,
};

const typeColor: Record<string, string> = {
  credit: "bg-success/10 text-success",
  debit: "bg-destructive/10 text-destructive",
  convert: "bg-accent/10 text-accent",
  card: "bg-primary/10 text-primary",
  crypto: "bg-accent/10 text-accent",
};

const TransactionList = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-display text-foreground">Recent Transactions</h3>
        <button className="text-sm text-accent font-medium hover:underline font-body">View All</button>
      </div>
      {transactions.map((tx, i) => {
        const Icon = typeIcon[tx.type];
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card hover:shadow-card transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[tx.type]}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground font-body truncate">{tx.title}</p>
              <p className="text-xs text-muted-foreground font-body">{tx.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold font-display ${tx.positive ? "text-success" : "text-foreground"}`}>
                {tx.amount}
              </p>
              <p className="text-[10px] text-muted-foreground font-body">{tx.date}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TransactionList;
