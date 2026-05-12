import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PinVerifyDialog from "@/components/PinVerifyDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { verifyBiometric, isPlatformAuthenticatorAvailable } from "@/lib/webauthn";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVerified: () => void;
  title?: string;
}

/**
 * Biometric-first auth gate for sensitive actions.
 * - If biometrics are enabled & available on the device → prompts WebAuthn.
 * - User can fall back to PIN at any time.
 * - If biometrics are NOT enabled → goes straight to PIN.
 */
const BiometricGate: React.FC<Props> = ({ open, onOpenChange, onVerified, title = "Confirm to continue" }) => {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [phase, setPhase] = useState<"choose" | "bio" | "pin">("choose");
  const [busy, setBusy] = useState(false);

  const biometricEnabled =
    !!profile?.biometric_enabled && !!settings?.biometric_credential_id;

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBioAvailable);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPhase(biometricEnabled && bioAvailable ? "bio" : "pin");
  }, [open, biometricEnabled, bioAvailable]);

  const runBiometric = async () => {
    if (!settings?.biometric_credential_id) return;
    setBusy(true);
    try {
      const ok = await verifyBiometric(settings.biometric_credential_id);
      if (ok) {
        onVerified();
        onOpenChange(false);
      } else {
        toast.error("Biometric check failed. Use your PIN instead.");
        setPhase("pin");
      }
    } catch {
      setPhase("pin");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && phase === "bio" && !busy) runBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  if (phase === "pin") {
    return (
      <PinVerifyDialog
        open={open}
        onOpenChange={onOpenChange}
        onVerified={onVerified}
        title={title}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto p-0 rounded-3xl border-0 bg-background overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-10 pb-6">
          <motion.div
            animate={{ scale: busy ? [1, 1.08, 1] : 1 }}
            transition={{ repeat: busy ? Infinity : 0, duration: 1.2 }}
            className="w-16 h-16 rounded-2xl gradient-navy flex items-center justify-center shadow-wallet mb-4"
          >
            <Fingerprint className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h3 className="text-lg font-semibold font-display text-foreground mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground font-body text-center">
            {busy ? "Verifying biometrics…" : "Use your fingerprint or face to confirm"}
          </p>

          <div className="mt-6 flex flex-col gap-2 w-full">
            <button
              onClick={runBiometric}
              disabled={busy}
              className="w-full h-12 rounded-2xl gradient-navy text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
              Try biometrics
            </button>
            <button
              onClick={() => setPhase("pin")}
              className="w-full h-11 rounded-2xl bg-muted text-foreground font-body text-sm"
            >
              Use PIN instead
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricGate;