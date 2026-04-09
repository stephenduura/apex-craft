import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Globe, Bell, Fingerprint, Shield, ChevronRight, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable, registerBiometric, verifyBiometric } from '@/lib/webauthn';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, isLoading, updateSettings } = useSettings();
  const { isDark, setDark } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable);
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setDark(checked);
    updateSettings.mutate({ dark_mode: checked });
  };

  const handleCurrencyChange = (currency: string) => {
    updateSettings.mutate({ default_currency: currency });
    toast({ title: 'Currency updated', description: `Default currency set to ${currency}` });
  };

  const handleNotificationsToggle = (checked: boolean) => {
    updateSettings.mutate({ push_notifications_enabled: checked });
    toast({ title: checked ? 'Notifications enabled' : 'Notifications disabled' });
  };

  const handleBiometricToggle = async (checked: boolean) => {
    if (!user || !profile) return;

    if (checked) {
      setBiometricRegistering(true);
      try {
        const { credentialId, publicKey } = await registerBiometric(
          user.id,
          profile.full_name || user.email || 'User'
        );
        updateSettings.mutate({
          biometric_credential_id: credentialId,
          biometric_public_key: publicKey,
        });
        toast({ title: 'Biometric registered', description: 'You can now use fingerprint or Face ID to verify actions' });
      } catch (err: any) {
        toast({ title: 'Biometric setup failed', description: err.message || 'Your device may not support this feature', variant: 'destructive' });
      } finally {
        setBiometricRegistering(false);
      }
    } else {
      updateSettings.mutate({
        biometric_credential_id: null,
        biometric_public_key: null,
      });
      toast({ title: 'Biometric disabled' });
    }
  };

  const testBiometric = async () => {
    if (!settings?.biometric_credential_id) return;
    try {
      const success = await verifyBiometric(settings.biometric_credential_id);
      toast({
        title: success ? 'Biometric verified!' : 'Verification failed',
        description: success ? 'Your identity was confirmed' : 'Could not verify your biometric',
        variant: success ? 'default' : 'destructive',
      });
    } catch {
      toast({ title: 'Verification failed', variant: 'destructive' });
    }
  };

  const biometricEnabled = !!settings?.biometric_credential_id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        </div>

        {/* Appearance Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Appearance</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">{isDark ? 'Dark theme active' : 'Light theme active'}</p>
              </div>
              <Switch checked={isDark} onCheckedChange={handleDarkModeToggle} />
            </div>
          </div>
        </motion.div>

        {/* Currency Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Preferences</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Default Currency</p>
                <p className="text-xs text-muted-foreground">Used across the app</p>
              </div>
              <Select value={settings?.default_currency || 'NGN'} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-24 h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">🇳🇬 NGN</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Transaction alerts & updates</p>
              </div>
              <Switch
                checked={settings?.push_notifications_enabled ?? true}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Security</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            {/* Biometric */}
            <div className="flex items-center gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${biometricEnabled ? 'bg-success/10' : 'bg-muted'}`}>
                <Fingerprint className={`w-5 h-5 ${biometricEnabled ? 'text-success' : 'text-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Biometric Login</p>
                <p className="text-xs text-muted-foreground">
                  {!biometricAvailable
                    ? 'Not supported on this device'
                    : biometricEnabled
                      ? 'Fingerprint / Face ID active'
                      : 'Enable fingerprint or Face ID'}
                </p>
              </div>
              {biometricRegistering ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              ) : (
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleBiometricToggle}
                  disabled={!biometricAvailable}
                />
              )}
            </div>

            {biometricEnabled && (
              <>
                <div className="border-t border-border" />
                <button onClick={testBiometric} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">Test Biometric</p>
                    <p className="text-xs text-muted-foreground">Verify your fingerprint or face</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}

            <div className="border-t border-border" />
            <button onClick={() => navigate('/pin-setup')} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Transaction PIN</p>
                <p className="text-xs text-muted-foreground">{profile?.pin_hash ? 'Change your PIN' : 'Set up transaction PIN'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-center py-4">
          <p className="text-xs text-muted-foreground">OVO Shield v1.0.0</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Protected by 256-bit encryption</p>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Settings;
