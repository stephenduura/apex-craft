import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gradient-accent mx-auto flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send a reset link</p>
            </div>
            <div className="bg-card rounded-2xl shadow-elevated p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full gradient-success mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-success-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Check your inbox</h2>
            <p className="text-sm text-muted-foreground mb-6">We've sent a password reset link to <strong>{email}</strong></p>
          </div>
        )}
        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-accent font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
