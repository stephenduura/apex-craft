import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Shield, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const allRulesPassed = passwordRules.every((r) => r.test(password));
  const canSubmit = fullName.trim() && email.trim() && allRulesPassed && agreedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setIsLoading(false);

    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/verify-email', { state: { email: email.trim() } });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-navy px-6 pt-14 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full border border-white/20" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-white">OVO Shield</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Create account</h1>
          <p className="text-white/60 font-body text-sm">Start your financial journey with OVO Shield</p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-6 -mt-4 max-w-lg mx-auto w-full pb-8"
      >
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-border pr-12"
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

              {/* Password strength */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5 pt-1"
                >
                  {passwordRules.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {passed ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span className={`text-xs ${passed ? 'text-success' : 'text-muted-foreground'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the <span className="text-accent font-medium">Terms of Service</span> and{' '}
                <span className="text-accent font-medium">Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full h-12 rounded-xl gradient-accent text-accent-foreground font-display font-semibold text-base hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
