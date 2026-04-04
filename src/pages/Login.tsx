import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-navy px-6 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full border border-white/20" />
          <div className="absolute bottom-0 left-4 w-48 h-48 rounded-full border border-white/10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-white">OVO Shield</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/60 font-body text-sm">Sign in to manage your finances securely</p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-6 -mt-4 max-w-lg mx-auto w-full"
      >
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-border focus:border-accent pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-8">
          <Shield className="w-4 h-4 text-success" />
          <span className="text-xs text-muted-foreground">Protected by 256-bit SSL encryption</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
