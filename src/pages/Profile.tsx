import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Shield, ChevronRight, User, Lock, Bell, HelpCircle, LogOut, Fingerprint, FileCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const hasPinSet = !!profile?.pin_hash;

  const profileItems = [
    { icon: User, label: "Personal Info", sublabel: "Name, email, phone", action: undefined },
    { icon: FileCheck, label: "KYC Verification", sublabel: profile?.kyc_status === 'verified' ? "BVN & NIN verified" : "Complete your verification", badge: profile?.kyc_status === 'verified' ? "Verified" : undefined, action: () => navigate('/kyc') },
    { icon: KeyRound, label: "Transaction PIN", sublabel: hasPinSet ? "PIN is active" : "Set up your PIN", badge: hasPinSet ? "Active" : "Setup", badgeVariant: hasPinSet ? 'success' : 'accent', action: () => navigate('/pin-setup') },
    { icon: Lock, label: "Security", sublabel: "Password & 2FA", action: undefined },
    { icon: Fingerprint, label: "Biometric Login", sublabel: "Face ID & fingerprint", action: undefined },
    { icon: Bell, label: "Notifications", sublabel: "Alerts & preferences", action: undefined },
    { icon: HelpCircle, label: "Help & Support", sublabel: "FAQs, contact us", action: undefined },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold font-display text-foreground truncate">{profile?.full_name || 'Shield User'}</p>
            <p className="text-sm text-muted-foreground font-body truncate">{user?.email || 'shield@ovomonie.com'}</p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-medium font-body flex-shrink-0">
            Tier {profile?.kyc_level || 0}
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
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-card hover:shadow-card transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-body">{item.label}</p>
                <p className="text-xs text-muted-foreground font-body">{item.sublabel}</p>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${
                  item.badgeVariant === 'accent'
                    ? 'text-accent bg-accent/10'
                    : 'text-success bg-success/10'
                }`}>
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
          onClick={handleSignOut}
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
