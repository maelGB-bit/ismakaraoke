import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mic2, Eye, EyeOff, KeyRound, Mail, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(8, 'Senha deve ter pelo menos 8 caracteres');

export default function HostAuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHosts, setHasHosts] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user is a host or coordinator
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .in('role', ['host', 'coordinator']);

        if (roleData && roleData.length > 0) {
          navigate('/host', { replace: true });
          return;
        }
      }

      // Check if any hosts OR coordinators exist - if any exist, show login form
      // Only show signup form if this is the very first user (no hosts exist)
      const { count: hostCount, error: countError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['host', 'coordinator']);
      
      if (countError) {
        console.error('Error checking hosts:', countError);
      }
      
      // Always default to login form if there are any hosts or coordinators
      // The signup option is ONLY for the very first host setup
      const hasAnyHosts = (hostCount ?? 0) > 0;
      setHasHosts(hasAnyHosts);
      // Default to login - coordinators are ALWAYS created by admin, they should never see signup
      // Only show signup if no hosts exist at all (first-time setup)
      setIsSignUp(!hasAnyHosts);
    } catch (error) {
      console.error('Error in checkAuthState:', error);
      // Default to login form on error
      setHasHosts(true);
      setIsSignUp(false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = (): boolean => {
    try {
      emailSchema.parse(email);
    } catch {
      toast({ 
        title: t('auth.invalidEmail') || 'Email inválido', 
        description: t('auth.enterValidEmail') || 'Digite um email válido',
        variant: 'destructive' 
      });
      return false;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast({ 
        title: t('auth.passwordTooShort'), 
        description: t('auth.passwordMinCharsNew') || 'A senha deve ter pelo menos 8 caracteres',
        variant: 'destructive' 
      });
      return false;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({ 
        title: t('auth.passwordsDontMatch'), 
        description: t('auth.enterSamePassword'), 
        variant: 'destructive' 
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/host`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({ 
            title: t('auth.emailInUse') || 'Email já cadastrado', 
            description: t('auth.tryLogin') || 'Tente fazer login',
            variant: 'destructive' 
          });
          setIsSignUp(false);
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // Add host role to the new user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: 'host' });

        if (roleError) {
          console.error('Error adding host role:', roleError);
          // Don't fail the signup, role might have been added by RLS policy
        }

        toast({ 
          title: t('auth.accountCreated') || '🎤 Conta criada!', 
          description: t('auth.welcomeHost') 
        });
        navigate('/host');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({ 
        title: t('auth.errorSigningUp') || 'Erro ao criar conta', 
        description: error.message || t('auth.tryAgain'), 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For login, only validate email format and that password is not empty
    try {
      emailSchema.parse(email);
    } catch {
      toast({ 
        title: t('auth.invalidEmail') || 'Email inválido', 
        description: t('auth.enterValidEmail') || 'Digite um email válido',
        variant: 'destructive' 
      });
      return;
    }

    if (!password.trim()) {
      toast({ 
        title: 'Senha obrigatória', 
        description: 'Digite sua senha',
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ 
            title: t('auth.wrongCredentials') || 'Credenciais inválidas', 
            description: t('auth.checkEmailPassword') || 'Verifique seu email e senha',
            variant: 'destructive' 
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // Check if user is a host or coordinator
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .in('role', ['host', 'coordinator']);

        if (!roleData || roleData.length === 0) {
          await supabase.auth.signOut();
          toast({ 
            title: t('auth.notAuthorized') || 'Não autorizado', 
            description: t('auth.notAHost') || 'Esta conta não tem permissão de organizador',
            variant: 'destructive' 
          });
          return;
        }

        // Clear any session invalidation flags (from force logout)
        try {
          await supabase.functions.invoke('clear-session-flag');
        } catch (flagError) {
          console.error('Error clearing session flag:', flagError);
          // Don't block login for this
        }

        toast({ 
          title: t('auth.accessGranted'), 
          description: t('auth.welcomeHost') 
        });
        navigate('/host', { replace: true });
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast({ 
        title: t('auth.errorLoggingIn') || 'Erro ao fazer login', 
        description: error.message || t('auth.tryAgain'), 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
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
              {isSignUp ? (
                <KeyRound className="w-16 h-16 text-accent mx-auto" />
              ) : (
                <Lock className="w-16 h-16 text-primary mx-auto" />
              )}
              <div className={`absolute inset-0 w-16 h-16 mx-auto ${isSignUp ? 'bg-accent/20' : 'bg-primary/20'} blur-xl rounded-full`} />
            </div>
          </motion.div>
          <h1 className={`text-3xl font-black font-display ${isSignUp ? 'neon-text-cyan' : 'neon-text-pink'} mb-2`}>
            {isSignUp ? (t('auth.createAccount') || 'Criar Conta') : t('auth.hostArea')}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp 
              ? (hasHosts 
                  ? (t('auth.createHostAccount') || 'Crie uma conta de organizador')
                  : (t('auth.firstHostSetup') || 'Configure o primeiro organizador'))
              : t('auth.enterCredentials') || 'Entre com suas credenciais'}
          </p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email">{t('auth.email') || 'Email'}</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={t('auth.emailPlaceholder') || 'seu@email.com'}
                className="pl-10" 
                autoFocus 
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">{isSignUp ? t('auth.newPassword') : (t('auth.password') || 'Senha')}</Label>
            <div className="relative mt-1">
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={t('auth.passwordPlaceholder')}
                className="pr-10" 
                disabled={isSubmitting}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="mt-1" 
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            className={`w-full font-bold ${isSignUp ? 'bg-accent hover:bg-accent/90 neon-glow-cyan' : 'bg-primary hover:bg-primary/90 neon-glow-pink'}`}
            disabled={isSubmitting}
          >
            {isSignUp ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {isSubmitting ? (t('auth.creating') || 'Criando...') : (t('auth.createAccountBtn') || 'Criar Conta')}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {isSubmitting ? t('auth.checking') : (t('auth.login') || 'Entrar')}
              </>
            )}
          </Button>
        </form>

        {hasHosts && (
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp 
                ? (t('auth.alreadyHaveAccount') || 'Já tem uma conta? Faça login')
                : (t('auth.needAccount') || 'Precisa de uma conta? Cadastre-se')}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('auth.hostOnlyArea') || 'Área exclusiva para organizadores do evento'}
        </p>
      </motion.div>
    </div>
  );
}