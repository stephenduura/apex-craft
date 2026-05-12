import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  to?: string; // explicit destination, otherwise navigate(-1)
  right?: React.ReactNode;
}

const PageHeader: React.FC<Props> = ({ title, subtitle, to, right }) => {
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-4"
    >
      <button
        onClick={() => (to ? navigate(to) : navigate(-1))}
        aria-label="Go back"
        className="w-10 h-10 rounded-xl bg-card border border-border shadow-card flex items-center justify-center active:scale-95 transition-transform"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold font-display text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-body truncate">{subtitle}</p>
        )}
      </div>
      {right}
    </motion.header>
  );
};

export default PageHeader;