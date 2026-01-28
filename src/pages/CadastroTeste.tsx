import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Send, CheckCircle, UserPlus, AlertTriangle, ShoppingCart, LogIn, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import mammothLogo from '@/assets/mammoth-logo.png';

export default function CadastroTeste() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [karaokeName, setKaraokeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [trialResult, setTrialResult] = useState<{
    tempPassword: string;
    instanceCode: string;
    expiresAt: string;
    trialHours: number;
    karaokeName: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !karaokeName.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: 'Email inválido', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setDuplicateError(null);

    try {
      const response = await supabase.functions.invoke('register-trial', {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          karaokeName: karaokeName.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success) {
        if (result.code === 'DUPLICATE_IP') {
          setDuplicateError(result.error);
          return;
        }
        throw new Error(result.error || 'Erro ao criar teste');
      }

      setTrialResult({
        tempPassword: result.tempPassword,
        instanceCode: result.instanceCode,
        expiresAt: result.expiresAt,
        trialHours: result.trialHours,
        karaokeName: result.karaokeName || karaokeName,
      });
      setSubmitted(true);
      toast({ title: 'Teste gratuito criado com sucesso!' });
    } catch (error: unknown) {
      console.error('Error registering trial:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar teste';
      
      if (message.includes('EMAIL_EXISTS') || message.includes('já possui')) {
        toast({ title: 'Este email já possui uma solicitação', variant: 'destructive' });
      } else {
        toast({ title: message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (duplicateError) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-6 rounded-xl text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Teste já realizado</h3>
            <p className="text-muted-foreground mb-6">
              {duplicateError}
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-landing-orange hover:bg-landing-orange/90"
                onClick={() => navigate('/planos')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Quero comprar um plano
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/app/login')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Já tenho conta, entrar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitted && trialResult) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-6 rounded-xl text-center">
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{trialResult.karaokeName}</h3>
            <p className="text-muted-foreground mb-4">
              Seu teste de {trialResult.trialHours} hora foi ativado com sucesso.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Expira em: {new Date(trialResult.expiresAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-sm">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-sm">
                <strong>Senha temporária:</strong> {trialResult.tempPassword}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Você será solicitado a trocar a senha no primeiro acesso.
              </p>
            </div>

            <Button 
              className="w-full"
              onClick={() => navigate('/app/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Entrar no Sistema
            </Button>
          </div>
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
          Teste gratuito por 1 hora
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Cadastro para Teste</h2>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                O tempo de teste começa assim que você confirmar e dura apenas <strong>1 hora</strong>.
              </span>
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isSubmitting}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={isSubmitting}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="karaokeName">Nome do seu Karaokê</Label>
              <Input
                id="karaokeName"
                type="text"
                value={karaokeName}
                onChange={(e) => setKaraokeName(e.target.value)}
                placeholder="Ex: Karaokê do João"
                disabled={isSubmitting}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será exibido para os participantes
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Iniciar Teste Gratuito
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-muted-foreground mb-4">
              Já tem uma conta?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/app/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Entrar no Sistema
            </Button>
          </div>
        </div>
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
