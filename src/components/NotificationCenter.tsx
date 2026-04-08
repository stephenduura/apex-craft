import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, Link2, Shield, Info } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, any> = {
  transfer: ArrowDownLeft,
  payment: Link2,
  security: Shield,
  general: Info,
};

const typeColors: Record<string, string> = {
  transfer: "bg-success/10 text-success",
  payment: "bg-accent/10 text-accent",
  security: "bg-destructive/10 text-destructive",
  general: "bg-muted text-muted-foreground",
};

const NotificationCenter = ({ open, onClose }: Props) => {
  const { data: notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-elevated max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">Notifications</h2>
                <p className="text-xs text-muted-foreground font-body">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                  title="Mark all read"
                >
                  <CheckCheck className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!notifications?.length ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-body">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => <NotificationItem key={n.id} notification={n} index={i} onRead={() => markAsRead.mutate(n.id)} />)
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const NotificationItem = ({ notification, index, onRead }: { notification: Notification; index: number; onRead: () => void }) => {
  const Icon = typeIcons[notification.type] || Info;
  const colorClass = typeColors[notification.type] || typeColors.general;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => !notification.is_read && onRead()}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${
        notification.is_read ? "opacity-60" : "bg-accent/5"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground font-body truncate">{notification.title}</p>
          {!notification.is_read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground font-body line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/70 font-body mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.button>
  );
};

export default NotificationCenter;
