import { useState } from "react";
import { Eye, EyeOff, ArrowDownLeft, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { DigitalAssetWallet } from "@/hooks/useDigitalAssets";

interface AssetWalletCardProps {
  wallet: DigitalAssetWallet;
  onReceive: () => void;
  onSwap: () => void;
}

const AssetWalletCard = ({ wallet, onReceive, onSwap }: AssetWalletCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  const isUSDT = wallet.asset === "USDT";
  const gradientClass = isUSDT
    ? "from-emerald-700 via-emerald-800 to-emerald-900"
    : "from-blue-700 via-blue-800 to-blue-900";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-5 text-white min-w-[280px] shadow-lg`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUSDT ? "bg-emerald-500" : "bg-blue-500"}`}>
              {wallet.asset.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold font-display">{wallet.asset}</p>
              <p className="text-[10px] text-white/60 font-body">{wallet.network}</p>
            </div>
          </div>
          <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <div className="mb-5">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-body mb-1">Balance</p>
          <p className="text-2xl font-bold font-display">
            {showBalance ? `${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${wallet.asset}` : "••••••"}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onReceive} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-medium font-body transition-colors">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Receive
          </button>
          <button onClick={onSwap} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-medium font-body transition-colors">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Swap to ₦
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssetWalletCard;
