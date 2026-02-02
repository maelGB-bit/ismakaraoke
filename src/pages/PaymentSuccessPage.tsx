import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Mail, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center">
              <CardHeader>
                {loading ? (
                  <div className="mx-auto w-16 h-16 rounded-full bg-landing-orange/20 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-landing-orange animate-spin" />
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </motion.div>
                )}
                <CardTitle className="text-2xl">
                  {loading ? 'Processando seu pagamento...' : 'Pagamento Confirmado!'}
                </CardTitle>
                <CardDescription className="text-base">
                  {loading 
                    ? 'Aguarde enquanto finalizamos sua compra'
                    : 'Seu acesso ao Mamute Karaokê foi liberado com sucesso!'
                  }
                </CardDescription>
              </CardHeader>
              
              {!loading && (
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Verifique seu e-mail</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Enviamos suas credenciais de acesso para o e-mail cadastrado.
                      Caso seja seu primeiro acesso, você receberá uma senha temporária.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate('/app/auth/host')}
                      className="w-full bg-landing-orange hover:bg-landing-orange/90"
                      size="lg"
                    >
                      Acessar meu Karaokê
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="w-full"
                    >
                      Voltar ao site
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Dúvidas? Entre em contato pelo WhatsApp disponível no rodapé do site.
                  </p>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
