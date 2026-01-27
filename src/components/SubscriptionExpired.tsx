import { motion } from 'framer-motion';
import { Clock, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import mammothLogo from '@/assets/mammoth-logo.png';
import { INTEREST_LABELS, type SubscriptionInterest } from '@/types/admin';

interface SubscriptionExpiredProps {
  coordinatorName?: string;
}

export function SubscriptionExpired({ coordinatorName }: SubscriptionExpiredProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const subscriptionOptions: { type: SubscriptionInterest; price: string }[] = [
    { type: 'single_event', price: 'R$ 49,90' },
    { type: 'weekly', price: 'R$ 99,90' },
    { type: 'monthly', price: 'R$ 199,90' },
    { type: 'yearly', price: 'R$ 1.499,90' },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <img src={mammothLogo} alt="Mamutts Karaoke" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-3xl font-black font-display mb-2">
          <span className="neon-text-pink">MAMUTTS</span>{' '}
          <span className="neon-text-cyan">KARAOKE</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-card border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">
              Sua assinatura expirou
            </CardTitle>
            <CardDescription>
              {coordinatorName ? `Olá ${coordinatorName}, ` : ''}
              Sua autorização para usar o sistema expirou. 
              Escolha uma opção abaixo para renovar sua assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {subscriptionOptions.map((option) => (
                <Card 
                  key={option.type} 
                  className="glass-card cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    // In a real app, this would open a payment flow
                    alert(`Entre em contato para renovar: ${INTEREST_LABELS[option.type]}`);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="font-bold text-lg">{INTEREST_LABELS[option.type]}</h3>
                    <p className="text-2xl font-black text-primary mt-2">{option.price}</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renovar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleLogout}>
                <Home className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
