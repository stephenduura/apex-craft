import { useState } from "react";
import { Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationCenter from "@/components/NotificationCenter";

const AppHeader = () => {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center shadow-wallet">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-body">Welcome back,</p>
            <p className="text-base font-semibold font-display text-foreground truncate max-w-[180px]">
              {profile?.full_name || "Shield User"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="relative p-2.5 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated transition-shadow"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </motion.header>
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};

export default AppHeader;
