import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
const mamuteLogo = '/img/mamute-logo.png';

export default function EntrarSistema() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16 min-h-[60vh] flex items-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center"
          >
            <img 
              src={mamuteLogo} 
              alt="Mamute Karaokê" 
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-landing-dark mb-4">
              Entrar no <span className="text-landing-orange">Sistema</span>
            </h1>
            <p className="text-landing-dark/60 mb-8">
              Clique no botão abaixo para acessar o ambiente operacional do Mamute Karaokê.
            </p>
            
            <Button 
              size="lg" 
              className="bg-landing-orange hover:bg-landing-orange/90 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg shadow-landing-orange/30"
              onClick={() => navigate('/app/login')}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar no Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
