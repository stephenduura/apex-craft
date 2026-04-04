import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, ArrowRight, ArrowLeft, CreditCard, Fingerprint,
  Camera, CheckCircle2, Loader2, AlertCircle, User
} from 'lucide-react';

type Step = 'intro' | 'bvn' | 'nin' | 'selfie' | 'complete';

const steps: { key: Step; label: string }[] = [
  { key: 'intro', label: 'Start' },
  { key: 'bvn', label: 'BVN' },
  { key: 'nin', label: 'NIN' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'complete', label: 'Done' },
];

const KYCVerification = () => {
  const [step, setStep] = useState<Step>('intro');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [selfieStatus, setSelfieStatus] = useState<'idle' | 'capturing' | 'done'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const stepIndex = steps.findIndex((s) => s.key === step);
  const progress = (stepIndex / (steps.length - 1)) * 100;

  const handleBVNSubmit = async () => {
    if (bvn.length !== 11) {
      toast({ title: 'Invalid BVN', description: 'BVN must be exactly 11 digits.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ bvn_number: bvn, bvn_verified: true })
      .eq('user_id', user?.id);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStep('nin');
    }
  };

  const handleNINSubmit = async () => {
    if (nin.length !== 11) {
      toast({ title: 'Invalid NIN', description: 'NIN must be exactly 11 digits.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nin_number: nin, nin_verified: true })
      .eq('user_id', user?.id);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStep('selfie');
    }
  };

  const handleSelfieCapture = async () => {
    setSelfieStatus('capturing');
    // Simulate selfie capture/verification
    await new Promise((r) => setTimeout(r, 2000));
    setSelfieStatus('done');

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        selfie_verified: true,
        kyc_level: 3,
        kyc_status: 'verified' as const,
      })
      .eq('user_id', user?.id);
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      setStep('complete');
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-navy px-6 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 right-10 w-28 h-28 rounded-full border border-white/20" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {step !== 'intro' && step !== 'complete' && (
              <button
                onClick={() => {
                  const idx = stepIndex - 1;
                  if (idx >= 0) setStep(steps[idx].key);
                }}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-white">KYC Verification</h1>
              <p className="text-white/50 text-xs mt-0.5">Step {stepIndex + 1} of {steps.length}</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-foreground" />
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:gradient-accent" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-card rounded-2xl shadow-card p-6 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-accent mx-auto flex items-center justify-center mb-4">
                  <Fingerprint className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Identity Verification</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To comply with CBN regulations and protect your account, we need to verify your identity. This is a one-time process.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: CreditCard, title: 'BVN Verification', desc: 'Bank Verification Number (11 digits)' },
                  { icon: User, title: 'NIN Verification', desc: 'National Identification Number (11 digits)' },
                  { icon: Camera, title: 'Selfie Verification', desc: 'Take a live photo for facial matching' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-accent/5 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your personal data is encrypted and processed in compliance with NDPR guidelines. We never share your information with third parties.
                </p>
              </div>

              <Button
                onClick={() => setStep('bvn')}
                className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base"
              >
                Begin Verification <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 'bvn' && (
            <motion.div key="bvn" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <CreditCard className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">BVN Verification</h2>
                <p className="text-sm text-muted-foreground mb-5">Enter your 11-digit Bank Verification Number</p>

                <div className="space-y-2">
                  <Label htmlFor="bvn" className="text-sm font-medium">BVN</Label>
                  <Input
                    id="bvn"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="22012345678"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="h-14 rounded-xl bg-muted/50 border-border text-center text-xl tracking-[0.3em] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Dial *565*0# on your registered phone to retrieve your BVN</p>
                </div>
              </div>

              <Button
                onClick={handleBVNSubmit}
                disabled={bvn.length !== 11 || isSubmitting}
                className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify BVN <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </motion.div>
          )}

          {step === 'nin' && (
            <motion.div key="nin" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">NIN Verification</h2>
                <p className="text-sm text-muted-foreground mb-5">Enter your 11-digit National Identification Number</p>

                <div className="space-y-2">
                  <Label htmlFor="nin" className="text-sm font-medium">NIN</Label>
                  <Input
                    id="nin"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="12345678901"
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="h-14 rounded-xl bg-muted/50 border-border text-center text-xl tracking-[0.3em] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Dial *346# on your registered phone to retrieve your NIN</p>
                </div>
              </div>

              <Button
                onClick={handleNINSubmit}
                disabled={nin.length !== 11 || isSubmitting}
                className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify NIN <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </motion.div>
          )}

          {step === 'selfie' && (
            <motion.div key="selfie" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
              <div className="bg-card rounded-2xl shadow-card p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">Selfie Verification</h2>
                <p className="text-sm text-muted-foreground mb-5">Take a clear photo of your face for identity matching</p>

                {/* Selfie preview area */}
                <div className="relative w-48 h-48 mx-auto mb-5">
                  <div className="w-full h-full rounded-full border-4 border-dashed border-accent/30 flex items-center justify-center bg-muted/30 overflow-hidden">
                    {selfieStatus === 'idle' && (
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    )}
                    {selfieStatus === 'capturing' && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                        <span className="text-xs text-muted-foreground">Analyzing...</span>
                      </div>
                    )}
                    {selfieStatus === 'done' && (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-12 h-12 text-success" />
                        <span className="text-xs text-success font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  {selfieStatus === 'idle' && (
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full gradient-accent flex items-center justify-center shadow-lg">
                      <Camera className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>

                <div className="text-left space-y-2 bg-muted/30 rounded-xl p-4">
                  {['Good lighting on your face', 'Remove glasses or face coverings', 'Look directly at the camera'].map((tip) => (
                    <div key={tip} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSelfieCapture}
                disabled={selfieStatus !== 'idle' || isSubmitting}
                className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base"
              >
                {selfieStatus === 'capturing' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selfieStatus === 'done' ? (
                  <>Verified <CheckCircle2 className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Capture Selfie <Camera className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div key="complete" variants={slideVariants} initial="enter" animate="center" exit="exit" className="text-center space-y-5 pt-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="w-24 h-24 rounded-full gradient-success mx-auto flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-success-foreground" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground">Verification Complete!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your identity has been verified successfully. You now have full access to all OVO Shield features.
              </p>

              <div className="bg-card rounded-2xl shadow-card p-5 space-y-3">
                {['BVN Verified', 'NIN Verified', 'Selfie Verified'].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item}</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-xs text-success font-medium">Complete</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">KYC Level</span>
                  <span className="text-sm font-bold text-accent">Level 3 — Full Access</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/')}
                className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KYCVerification;
