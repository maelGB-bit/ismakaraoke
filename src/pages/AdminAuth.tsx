import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Mail, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(8, 'Senha deve ter pelo menos 8 caracteres');

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const roles = roleData?.map(r => r.role) || [];
      
      if (roles.includes('admin')) {
        navigate('/admin');
        return;
      } else if (roles.includes('coordinator')) {
        navigate('/host');
        return;
      }
    }

    setIsLoading(false);
  };

  const validateInputs = (): boolean => {
    try {
      emailSchema.parse(email);
    } catch {
      toast({ 
        title: t('auth.invalidEmail') || 'Email inválido', 
        variant: 'destructive' 
      });
      return false;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast({ 
        title: t('auth.passwordTooShort'), 
        variant: 'destructive' 
      });
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({ 
          title: t('auth.wrongCredentials') || 'Credenciais inválidas', 
          variant: 'destructive' 
        });
        return;
      }

      if (data.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const roles = roleData?.map(r => r.role) || [];

        if (roles.includes('admin')) {
          toast({ title: 'Acesso concedido', description: 'Bem-vindo, Administrador!' });
          navigate('/admin');
        } else if (roles.includes('coordinator')) {
          toast({ title: 'Acesso concedido', description: 'Bem-vindo, Coordenador!' });
          navigate('/host');
        } else {
          await supabase.auth.signOut();
          toast({ 
            title: 'Não autorizado', 
            description: 'Esta conta não tem permissão de acesso',
            variant: 'destructive' 
          });
        }
      }
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
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
              <Shield className="w-16 h-16 text-primary mx-auto" />
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-primary/20 blur-xl rounded-full" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black font-display neon-text-pink mb-2">
            Área Administrativa
          </h1>
          <p className="text-muted-foreground">
            Entre com suas credenciais de administrador ou coordenador
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu@email.com"
                className="pl-10" 
                autoFocus 
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative mt-1">
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="pr-10" 
                disabled={isSubmitting}
                autoComplete="current-password"
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

          <Button 
            type="submit" 
            size="lg" 
            className="w-full font-bold bg-primary hover:bg-primary/90 neon-glow-pink"
            disabled={isSubmitting}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Área restrita para administradores e coordenadores
        </p>
      </motion.div>
    </div>
  );
}
