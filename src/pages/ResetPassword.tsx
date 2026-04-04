import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      toast({ title: 'Invalid link', description: 'This password reset link is invalid or expired.', variant: 'destructive' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Too short', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full gradient-success mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Password Updated</h2>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-accent mx-auto flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">New Password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl bg-muted/50"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
