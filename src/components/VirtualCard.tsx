import { motion } from "framer-motion";
import { Shield, Snowflake, Copy, Play, AlertTriangle } from "lucide-react";
import { VirtualCard as VirtualCardType } from "@/hooks/useVirtualCards";
import { toast } from "sonner";

interface VirtualCardProps {
  card: VirtualCardType;
  onToggleFreeze?: () => void;
}

const VirtualCard = ({ card, onToggleFreeze }: VirtualCardProps) => {
  const isFrozen = card.status === "frozen";
  const isCancelled = card.status === "cancelled";

  const handleCopy = () => {
    navigator.clipboard.writeText(`**** **** **** ${card.card_number_last4}`);
    toast.success("Card number copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-wallet ${
        isFrozen ? "bg-muted" : isCancelled ? "bg-destructive/10" : "gradient-navy"
      }`}
    >
      {/* Card shimmer */}
      {!isFrozen && !isCancelled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
      )}

      {/* Decorative circles */}
      <div className={`absolute top-4 right-4 w-20 h-20 rounded-full border ${
        isFrozen ? "border-muted-foreground/10" : "border-primary-foreground/10"
      }`} />
      <div className={`absolute top-6 right-6 w-16 h-16 rounded-full border ${
        isFrozen ? "border-muted-foreground/10" : "border-primary-foreground/10"
      }`} />

      {/* Frozen overlay */}
      {isFrozen && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Snowflake className="w-6 h-6" />
            <span className="font-display font-semibold text-lg">Card Frozen</span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${isFrozen ? "text-muted-foreground" : "text-accent"}`} />
            <span className={`text-sm font-display font-semibold ${
              isFrozen ? "text-muted-foreground" : "text-primary-foreground"
            }`}>OVO Shield</span>
          </div>
          <span className={`text-xs font-body ${
            isFrozen ? "text-muted-foreground/60" : "text-primary-foreground/60"
          }`}>
            {card.card_type} • {card.currency} • {card.brand}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-lg font-display font-medium tracking-[0.2em] ${
              isFrozen ? "text-muted-foreground" : "text-primary-foreground"
            }`}>
              •••• •••• •••• {card.card_number_last4}
            </p>
            <button onClick={handleCopy} className={`p-1 rounded transition-colors ${
              isFrozen ? "hover:bg-muted-foreground/10" : "hover:bg-primary-foreground/10"
            }`}>
              <Copy className={`w-3.5 h-3.5 ${
                isFrozen ? "text-muted-foreground/40" : "text-primary-foreground/40"
              }`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[10px] uppercase tracking-wider font-body ${
              isFrozen ? "text-muted-foreground/40" : "text-primary-foreground/40"
            }`}>Card Holder</p>
            <p className={`text-sm font-medium font-body ${
              isFrozen ? "text-muted-foreground" : "text-primary-foreground"
            }`}>{card.card_holder_name}</p>
          </div>
          <div className="text-right">
            <p className={`text-[10px] uppercase tracking-wider font-body ${
              isFrozen ? "text-muted-foreground/40" : "text-primary-foreground/40"
            }`}>Expires</p>
            <p className={`text-sm font-medium font-body ${
              isFrozen ? "text-muted-foreground" : "text-primary-foreground"
            }`}>
              {String(card.expiry_month).padStart(2, "0")}/{String(card.expiry_year).slice(-2)}
            </p>
          </div>
          <button
            onClick={onToggleFreeze}
            className={`p-2 rounded-xl transition-colors ${
              isFrozen
                ? "bg-accent/20 hover:bg-accent/30 text-accent"
                : "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground/70"
            }`}
          >
            {isFrozen ? <Play className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VirtualCard;
