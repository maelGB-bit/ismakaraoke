import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mic2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

interface HostAuthProps {
  children: React.ReactNode;
}

interface HostAuthContextType {
  logout: () => void;
}

const HostAuthContext = createContext<HostAuthContextType | null>(null);

export const useHostAuth = () => {
  const context = useContext(HostAuthContext);
  if (!context) {
    throw new Error('useHostAuth must be used within HostAuth');
  }
  return context;
};

const AUTH_KEY = 'karaoke_host_auth';

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function HostAuth({ children }: HostAuthProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    const authSession = sessionStorage.getItem(AUTH_KEY);
    if (authSession === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('host_settings')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking host settings:', error);
      setIsLoading(false);
      return;
    }

    setIsFirstSetup(!data || data.length === 0);
    setIsLoading(false);
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 4) {
      toast({ title: t('auth.passwordTooShort'), description: t('auth.passwordMinChars'), variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t('auth.passwordsDontMatch'), description: t('auth.enterSamePassword'), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await hashPassword(password);
      const { error } = await supabase.from('host_settings').insert({ password_hash: passwordHash });
      if (error) throw error;
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      toast({ title: t('auth.passwordCreated'), description: t('auth.welcomeHost') });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({ title: t('auth.errorSavingPassword'), description: t('auth.tryAgain'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const passwordHash = await hashPassword(password);
      const { data, error } = await supabase.from('host_settings').select('password_hash').limit(1).maybeSingle();
      if (error) throw error;
      if (data && data.password_hash === passwordHash) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        toast({ title: t('auth.accessGranted'), description: t('auth.welcomeHost') });
      } else {
        toast({ title: t('auth.wrongPassword'), description: t('auth.tryAgain'), variant: 'destructive' });
        setPassword('');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast({ title: t('auth.errorCheckingPassword'), description: t('auth.tryAgain'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setConfirmPassword('');
    toast({ title: t('auth.sessionEnded'), description: t('auth.leftHostArea') });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse-slow"><Mic2 className="w-16 h-16 text-primary" /></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <HostAuthContext.Provider value={{ logout }}>{children}</HostAuthContext.Provider>;
  }

  if (isFirstSetup) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="inline-block mb-4">
              <div className="relative"><KeyRound className="w-16 h-16 text-accent mx-auto" /><div className="absolute inset-0 w-16 h-16 mx-auto bg-accent/20 blur-xl rounded-full" /></div>
            </motion.div>
            <h1 className="text-3xl font-black font-display neon-text-cyan mb-2">{t('auth.setupPassword')}</h1>
            <p className="text-muted-foreground">{t('auth.createPassword')}</p>
          </div>
          <form onSubmit={handleSetupPassword} className="space-y-6">
            <div>
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.createPasswordPlaceholder')} className="pr-10" autoFocus disabled={isSubmitting} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('auth.confirmPasswordPlaceholder')} className="mt-1" disabled={isSubmitting} />
            </div>
            <Button type="submit" size="lg" className="w-full font-bold bg-accent hover:bg-accent/90 neon-glow-cyan" disabled={isSubmitting}>
              <KeyRound className="mr-2 h-4 w-4" />{isSubmitting ? t('auth.saving') : t('auth.createPasswordBtn')}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">{t('auth.passwordProtection')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="inline-block mb-4">
            <div className="relative"><Lock className="w-16 h-16 text-primary mx-auto" /><div className="absolute inset-0 w-16 h-16 mx-auto bg-primary/20 blur-xl rounded-full" /></div>
          </motion.div>
          <h1 className="text-3xl font-black font-display neon-text-pink mb-2">{t('auth.hostArea')}</h1>
          <p className="text-muted-foreground">{t('auth.enterPassword')}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="password">{t('auth.hostPassword')}</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} className="pr-10" autoFocus disabled={isSubmitting} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full font-bold bg-primary hover:bg-primary/90 neon-glow-pink" disabled={isSubmitting}>
            <Lock className="mr-2 h-4 w-4" />{isSubmitting ? t('auth.checking') : t('auth.openAccess')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
