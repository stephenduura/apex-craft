import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface PinVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
}

const PinVerifyDialog: React.FC<PinVerifyDialogProps> = ({
  open,
  onOpenChange,
  onVerified,
  title = 'Enter Transaction PIN',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    setError('');
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) verifyPin(next);
  };

  const handleBackspace = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (value: string) => {
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-pin', {
        body: { pin: value },
      });

      if (fnError) throw fnError;
      if (data?.verified) {
        setPin('');
        onVerified();
        onOpenChange(false);
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Verification failed. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setPin('');
      setError('');
    }
    onOpenChange(val);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto p-0 rounded-3xl border-0 bg-background overflow-hidden">
        <div className="flex flex-col items-center pt-8 pb-2 px-6">
          <div className="w-14 h-14 rounded-2xl gradient-navy flex items-center justify-center shadow-wallet mb-4">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold font-display text-foreground mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground font-body">Enter your 4-digit PIN to continue</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-4 py-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === pin.length ? [1, 1.15, 1] : 1,
                backgroundColor: i < pin.length ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              }}
              transition={{ duration: 0.15 }}
              className="w-3.5 h-3.5 rounded-full"
            />
          ))}
        </div>

        <div className="h-5 flex items-center justify-center">
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs font-medium font-body">
              {error}
            </motion.p>
          )}
        </div>

        {/* Keypad */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              if (d === 'back') {
                return (
                  <button key={i} onClick={handleBackspace} disabled={loading} className="h-14 rounded-2xl flex items-center justify-center text-foreground font-display text-lg active:bg-muted transition-colors">
                    ⌫
                  </button>
                );
              }
              return (
                <button key={i} onClick={() => handleDigit(d)} disabled={loading} className="h-14 rounded-2xl bg-card shadow-card flex items-center justify-center text-foreground font-display text-xl font-semibold active:scale-95 active:bg-muted transition-all">
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinVerifyDialog;
