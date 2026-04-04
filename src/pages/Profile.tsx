import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Shield, ChevronRight, User, Lock, Bell, HelpCircle, LogOut, Fingerprint, FileCheck } from "lucide-react";

const profileItems = [
  { icon: User, label: "Personal Info", sublabel: "Name, email, phone" },
  { icon: FileCheck, label: "KYC Verification", sublabel: "BVN & NIN verified", badge: "Verified" },
  { icon: Lock, label: "Security", sublabel: "PIN, biometrics, 2FA" },
  { icon: Fingerprint, label: "Biometric Login", sublabel: "Face ID & fingerprint" },
  { icon: Bell, label: "Notifications", sublabel: "Alerts & preferences" },
  { icon: HelpCircle, label: "Help & Support", sublabel: "FAQs, contact us" },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Profile</h1>

        {/* Avatar section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card shadow-card border border-border mb-6"
        >
          <div className="w-14 h-14 rounded-2xl gradient-navy flex items-center justify-center shadow-wallet">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold font-display text-foreground">Shield User</p>
            <p className="text-sm text-muted-foreground font-body">shield@ovomonie.com</p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-medium font-body">
            Tier 3
          </div>
        </motion.div>

        {/* Menu items */}
        <div className="space-y-1">
          {profileItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-card hover:shadow-card transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4.5 h-4.5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-body">{item.label}</p>
                <p className="text-xs text-muted-foreground font-body">{item.sublabel}</p>
              </div>
              {item.badge && (
                <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium font-body text-sm">Sign Out</span>
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
