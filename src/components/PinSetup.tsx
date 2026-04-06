import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Step = 'create' | 'confirm' | 'success';

interface PinSetupProps {
  onComplete?: () => void;
  onBack?: () => void;
}

const PinSetup: React.FC<PinSetupProps> = ({ onComplete, onBack }) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentPin = step === 'create' ? pin : confirmPin;
  const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

  useEffect(() => {
    // Focus first empty slot
    const idx = currentPin.length;
    if (idx < 4) inputRefs.current[idx]?.focus();
  }, [currentPin, step]);

  const handleDigit = (digit: string) => {
    if (currentPin.length >= 4) return;
    setError('');
    const next = currentPin + digit;
    setCurrentPin(next);

    if (next.length === 4) {
      if (step === 'create') {
        setTimeout(() => setStep('confirm'), 300);
      } else {
        handleConfirm(next);
      }
    }
  };

  const handleBackspace = () => {
    setError('');
    setCurrentPin(currentPin.slice(0, -1));
  };

  const handleConfirm = async (confirmValue: string) => {
    if (pin !== confirmValue) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('set-pin', {
        body: { pin },
      });

      if (fnError) throw fnError;

      await refreshProfile();
      setStep('success');
      toast.success('Transaction PIN set successfully');
    } catch (err: any) {
      setError('Failed to set PIN. Please try again.');
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleStepBack = () => {
    if (step === 'confirm') {
      setConfirmPin('');
      setError('');
      setStep('create');
    } else if (onBack) {
      onBack();
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        {step !== 'success' && (
          <button onClick={handleStepBack} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-card">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-lg font-semibold font-display text-foreground">
          {step === 'create' ? 'Create PIN' : step === 'confirm' ? 'Confirm PIN' : 'PIN Set'}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {step === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center"
            >
              <ShieldCheck className="w-12 h-12 text-success" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground mb-2">PIN Created!</h2>
              <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-xs">
                Your 4-digit transaction PIN is now active. You'll need it to authorize transfers, conversions, and card payments.
              </p>
            </div>
            <Button
              onClick={onComplete}
              className="w-full max-w-xs h-14 rounded-2xl gradient-navy text-primary-foreground font-semibold font-display text-base shadow-wallet"
            >
              Continue
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 'confirm' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: step === 'confirm' ? -40 : 40 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon & description */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              <div className="w-16 h-16 rounded-2xl gradient-navy flex items-center justify-center shadow-wallet mb-5">
                <Lock className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground font-body text-sm text-center max-w-xs leading-relaxed">
                {step === 'create'
                  ? 'Create a 4-digit PIN to secure your transactions. Keep it confidential.'
                  : 'Enter your PIN again to confirm.'}
              </p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i === currentPin.length ? [1, 1.15, 1] : 1,
                    backgroundColor: i < currentPin.length
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted))',
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-4 rounded-full"
                />
              ))}
            </div>

            {/* Error */}
            <div className="h-6 flex items-center justify-center">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs font-medium font-body"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Keypad */}
            <div className="flex-1 flex items-end pb-8 px-6">
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
                {digits.map((d, i) => {
                  if (d === '') return <div key={i} />;
                  if (d === 'back') {
                    return (
                      <button
                        key={i}
                        onClick={handleBackspace}
                        disabled={loading}
                        className="h-16 rounded-2xl flex items-center justify-center text-foreground font-display text-lg active:bg-muted transition-colors"
                      >
                        ⌫
                      </button>
                    );
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleDigit(d)}
                      disabled={loading}
                      className="h-16 rounded-2xl bg-card shadow-card flex items-center justify-center text-foreground font-display text-xl font-semibold active:scale-95 active:bg-muted transition-all"
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PinSetup;
