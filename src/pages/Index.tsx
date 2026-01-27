import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Loader2, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import mammothLogo from '@/assets/mammoth-logo.png';
import { InterestForm } from '@/components/InterestForm';

export default function Index() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        console.log('Index: Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Index: Session check error:', error);
        }
        
        if (session?.user && isMounted) {
          console.log('Index: User found, redirecting based on role...');
          await redirectBasedOnRole(session.user.id);
        }
      } catch (err) {
        console.error('Index: Unexpected error checking session:', err);
      } finally {
        if (isMounted) {
          console.log('Index: Session check complete');
          setCheckingSession(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Index: Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          await redirectBasedOnRole(session.user.id);
        }
      }
    );

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && checkingSession) {
        console.warn('Index: Session check timeout, forcing render');
        setCheckingSession(false);
      }
    }, 3000);

    checkSession();
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      console.log('Index: Fetching roles for user:', userId);
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Index: Error fetching roles:', error);
        return;
      }

      console.log('Index: User roles:', roles);
      const userRoles = roles?.map(r => r.role) || [];

      if (userRoles.includes('admin')) {
        console.log('Index: Redirecting to /admin');
        navigate('/admin');
      } else if (userRoles.includes('coordinator')) {
        console.log('Index: Redirecting to /host');
        navigate('/host');
      } else {
        console.log('Index: No recognized role found');
      }
    } catch (err) {
      console.error('Index: Error in redirectBasedOnRole:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        await redirectBasedOnRole(data.user.id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-block mb-4"
        >
          <div className="relative">
            <img src={mammothLogo} alt="Mamutts Karaoke" className="w-24 h-24 animate-float" />
            <div className="absolute inset-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
          </div>
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black font-display mb-2">
          <span className="neon-text-pink">MAMUTTS</span>{' '}
          <span className="neon-text-cyan">KARAOKE</span>
        </h1>
        <p className="text-muted-foreground">
          {t('app.subtitle')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md"
      >
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </TabsTrigger>
            <TabsTrigger value="interest" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tenho Interesse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="glass-card p-6 rounded-xl">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mic2 className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="interest">
            <InterestForm />
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        {t('app.madeWith')}
      </motion.p>
    </div>
  );
}
