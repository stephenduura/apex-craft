import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, Bitcoin, Wallet, Inbox } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { format, isToday, isYesterday } from "date-fns";

const typeIcon: Record<string, typeof ArrowDownLeft> = {
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
  convert: ArrowLeftRight,
  card: CreditCard,
  crypto: Bitcoin,
  fund: ArrowDownLeft,
  withdraw: ArrowUpRight,
};

const typeColor: Record<string, string> = {
  credit: "bg-success/10 text-success",
  debit: "bg-destructive/10 text-destructive",
  convert: "bg-accent/10 text-accent",
  card: "bg-primary/10 text-primary",
  crypto: "bg-accent/10 text-accent",
  fund: "bg-success/10 text-success",
  withdraw: "bg-destructive/10 text-destructive",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function formatAmount(amount: number, currency: string, type: string) {
  const symbol = currency === "USD" ? "$" : "₦";
  const isPositive = ["credit", "fund", "crypto"].includes(type);
  const prefix = isPositive ? "+" : "-";
  return `${prefix}${symbol}${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

interface TransactionListProps {
  limit?: number;
  showHeader?: boolean;
  filter?: string;
}

const TransactionList = ({ limit = 10, showHeader = true, filter }: TransactionListProps) => {
  const { data: transactions, isLoading } = useTransactions(limit);

  const filtered = filter && filter !== "All"
    ? transactions?.filter((tx) => {
        const map: Record<string, string[]> = {
          Credits: ["credit", "fund"],
          Debits: ["debit", "withdraw"],
          Conversions: ["convert"],
          Cards: ["card"],
        };
        return map[filter]?.includes(tx.type);
      })
    : transactions;

  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-display text-foreground">Recent Transactions</h3>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : !filtered?.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium font-display text-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Fund your wallet to get started</p>
        </motion.div>
      ) : (
        filtered.map((tx, i) => {
          const Icon = typeIcon[tx.type] || Wallet;
          const isPositive = ["credit", "fund", "crypto"].includes(tx.type);
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:shadow-card transition-all cursor-pointer border border-transparent hover:border-border"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[tx.type] || "bg-muted text-foreground"}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-body truncate">{tx.title}</p>
                <p className="text-xs text-muted-foreground font-body">{tx.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold font-display ${isPositive ? "text-success" : "text-foreground"}`}>
                  {formatAmount(tx.amount, tx.currency, tx.type)}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">{formatDate(tx.created_at)}</p>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default TransactionList;
