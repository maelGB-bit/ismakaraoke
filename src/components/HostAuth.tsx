import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mic2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

// Simple hash function for password (not cryptographically secure, but adequate for this use case)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function HostAuth({ children }: HostAuthProps) {
  const { toast } = useToast();
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
    // Check if already authenticated in this session
    const authSession = sessionStorage.getItem(AUTH_KEY);
    if (authSession === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if password exists in database
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
      toast({
        title: 'Passwort zu kurz',
        description: 'Das Passwort muss mindestens 4 Zeichen haben',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwörter stimmen nicht überein',
        description: 'Gib in beiden Feldern das gleiche Passwort ein',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const passwordHash = await hashPassword(password);
      
      const { error } = await supabase
        .from('host_settings')
        .insert({ password_hash: passwordHash });

      if (error) throw error;

      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      toast({
        title: '🎤 Passwort eingerichtet!',
        description: 'Willkommen im Organisator-Bereich',
      });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({
        title: 'Fehler beim Speichern des Passworts',
        description: 'Bitte erneut versuchen',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const passwordHash = await hashPassword(password);
      
      const { data, error } = await supabase
        .from('host_settings')
        .select('password_hash')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.password_hash === passwordHash) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        toast({
          title: '🎤 Zugang gewährt!',
          description: 'Willkommen im Organisator-Bereich',
        });
      } else {
        toast({
          title: 'Falsches Passwort',
          description: 'Bitte erneut versuchen',
          variant: 'destructive',
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast({
        title: 'Fehler bei der Passwortüberprüfung',
        description: 'Bitte erneut versuchen',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setConfirmPassword('');
    toast({
      title: 'Sitzung beendet',
      description: 'Du hast den Organisator-Bereich verlassen',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse-slow">
          <Mic2 className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <HostAuthContext.Provider value={{ logout }}>
        {children}
      </HostAuthContext.Provider>
    );
  }

  // First time setup - create password
  if (isFirstSetup) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-block mb-4"
            >
              <div className="relative">
                <KeyRound className="w-16 h-16 text-accent mx-auto" />
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-accent/20 blur-xl rounded-full" />
              </div>
            </motion.div>
            
            <h1 className="text-3xl font-black font-display neon-text-cyan mb-2">
              Passwort einrichten
            </h1>
            <p className="text-muted-foreground">
              Erstelle ein Passwort, um den Organisator-Bereich zu schützen
            </p>
          </div>

          <form onSubmit={handleSetupPassword} className="space-y-6">
            <div>
              <Label htmlFor="password">Neues Passwort</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort erstellen..."
                  className="pr-10"
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort bestätigen..."
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold bg-accent hover:bg-accent/90 neon-glow-cyan"
              disabled={isSubmitting}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Speichern...' : 'Passwort erstellen'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Dieses Passwort wird verwendet, um den Organisator-Bereich zu schützen
          </p>
        </motion.div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <Lock className="w-16 h-16 text-primary mx-auto" />
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-primary/20 blur-xl rounded-full" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black font-display neon-text-pink mb-2">
            Organisator-Bereich
          </h1>
          <p className="text-muted-foreground">
            Gib das Passwort ein, um das Kontrollpanel zu öffnen
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="password">Host-Passwort</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                className="pr-10"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold bg-primary hover:bg-primary/90 neon-glow-pink"
            disabled={isSubmitting}
          >
            <Lock className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Überprüfen...' : 'Zugang öffnen'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
