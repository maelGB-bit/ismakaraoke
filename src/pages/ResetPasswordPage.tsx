import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, CheckCircle, Home, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const mamuteLogo = '/img/mamute-logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired'>('loading');
  
  const token = searchParams.get('token');

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setTokenStatus('invalid');
      return;
    }
    
    // Token exists, allow user to try resetting
    setTokenStatus('valid');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-reset-token', {
        body: { token, newPassword: password },
      });

      if (error) throw error;

      if (!data?.success) {
        if (data?.error === 'invalid_token') {
          setTokenStatus('invalid');
          toast({ title: data?.message || 'Token inválido', variant: 'destructive' });
        } else if (data?.error === 'token_expired') {
          setTokenStatus('expired');
          toast({ title: data?.message || 'Token expirado', variant: 'destructive' });
        } else {
          toast({ title: data?.message || 'Erro ao redefinir senha', variant: 'destructive' });
        }
        return;
      }

      setIsSuccess(true);
      toast({ title: 'Senha atualizada com sucesso!' });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/app/login');
      }, 3000);
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  if (tokenStatus === 'invalid' || tokenStatus === 'expired') {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-xl text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">
            {tokenStatus === 'expired' ? 'Link expirado' : 'Link inválido'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {tokenStatus === 'expired' 
              ? 'Este link de redefinição de senha expirou. Por favor, solicite um novo link.'
              : 'Este link de redefinição de senha não é válido. Por favor, solicite um novo link.'
            }
          </p>
          <Button onClick={() => navigate('/app/login')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Voltar ao início
        </Button>
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
            <img src={mamuteLogo} alt="Mamute Karaokê" className="w-24 h-24 animate-float" />
            <div className="absolute inset-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
          </div>
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black font-display mb-2">
          <span className="neon-text-pink">MAMUTE</span>{' '}
          <span className="neon-text-cyan">KARAOKÊ</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-6 rounded-xl">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-xl font-bold">Senha atualizada!</h2>
              <p className="text-center text-muted-foreground">
                Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes...
              </p>
              <Button onClick={() => navigate('/app/login')} className="w-full">
                Ir para o Login
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Criar nova senha</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
