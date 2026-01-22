import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mic2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface HostAuthProps {
  children: React.ReactNode;
}

// Senha padrão do organizador - pode ser alterada aqui
const HOST_PASSWORD = 'karaoke2024';
const AUTH_KEY = 'karaoke_host_auth';

export function HostAuth({ children }: HostAuthProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated in this session
    const authSession = sessionStorage.getItem(AUTH_KEY);
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === HOST_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      toast({
        title: '🎤 Acesso liberado!',
        description: 'Bem-vindo ao painel do organizador',
      });
    } else {
      toast({
        title: 'Senha incorreta',
        description: 'Tente novamente',
        variant: 'destructive',
      });
      setPassword('');
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

  if (isAuthenticated) {
    return <>{children}</>;
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
              <Lock className="w-16 h-16 text-primary mx-auto" />
              <div className="absolute inset-0 w-16 h-16 mx-auto bg-primary/20 blur-xl rounded-full" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black font-display neon-text-pink mb-2">
            Área do Organizador
          </h1>
          <p className="text-muted-foreground">
            Digite a senha para acessar o painel de controle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="password">Senha do Host</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha..."
                className="pr-10"
                autoFocus
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
          >
            <Lock className="mr-2 h-4 w-4" />
            Acessar Painel
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Dica: A senha padrão é <code className="text-primary">karaoke2024</code>
        </p>
      </motion.div>
    </div>
  );
}
