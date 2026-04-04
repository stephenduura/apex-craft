import { motion } from "framer-motion";
import { Plus, ArrowLeftRight, CreditCard, Bitcoin, Wallet, Send } from "lucide-react";

const actions = [
  { icon: Plus, label: "Fund", sublabel: "Add Money", color: "bg-primary text-primary-foreground" },
  { icon: ArrowLeftRight, label: "Convert", sublabel: "₦ ↔ $", color: "bg-accent text-accent-foreground" },
  { icon: CreditCard, label: "Card", sublabel: "Virtual USD", color: "bg-success text-success-foreground" },
  { icon: Send, label: "Send", sublabel: "Transfer", color: "bg-primary text-primary-foreground" },
  { icon: Bitcoin, label: "Crypto", sublabel: "USDT Fund", color: "bg-accent text-accent-foreground" },
  { icon: Wallet, label: "Withdraw", sublabel: "Cash Out", color: "bg-success text-success-foreground" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

const QuickActions = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          variants={item}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card shadow-card border border-border hover:shadow-elevated transition-shadow"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
            <action.icon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold font-display text-foreground">{action.label}</p>
            <p className="text-[10px] text-muted-foreground font-body">{action.sublabel}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
