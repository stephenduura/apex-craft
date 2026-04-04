import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email || '';
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email sent', description: 'Verification email has been resent.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full text-center"
      >
        <div className="w-20 h-20 rounded-full gradient-accent mx-auto flex items-center justify-center mb-6">
          <Mail className="w-9 h-9 text-accent-foreground" />
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Verify your email</h1>
        <p className="text-sm text-muted-foreground mb-1">We've sent a verification link to</p>
        <p className="text-sm font-semibold text-foreground mb-6">{email || 'your email'}</p>

        <div className="bg-card rounded-2xl shadow-card p-5 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-accent">1</span>
            </div>
            <p className="text-sm text-muted-foreground">Open your email inbox</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-accent">2</span>
            </div>
            <p className="text-sm text-muted-foreground">Click the verification link</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-accent">3</span>
            </div>
            <p className="text-sm text-muted-foreground">You'll be redirected to complete setup</p>
          </div>
        </div>

        <Button
          onClick={handleResend}
          disabled={resending}
          variant="outline"
          className="w-full h-11 rounded-xl mb-3"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
          Resend verification email
        </Button>

        <Button
          onClick={() => navigate('/login')}
          className="w-full h-11 rounded-xl gradient-accent text-accent-foreground font-display font-semibold"
        >
          Go to Login <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-4 h-4 text-success" />
          <span className="text-xs text-muted-foreground">Secured by OVO Shield</span>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
