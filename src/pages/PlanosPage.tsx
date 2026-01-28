import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PlanCard } from '@/components/landing/PlanCard';

const plans = [
  {
    name: 'Free',
    price: 'R$ 0,00',
    duration: '1 hora',
    ideal: 'Testar rapidamente o sistema',
    buttonText: 'Começar grátis',
    isPopular: false,
    isPro: false,
  },
  {
    name: 'Silver',
    price: 'R$ 19,90',
    duration: '1 dia',
    ideal: 'Eventos únicos e festas pontuais',
    buttonText: 'Comprar Silver',
    isPopular: false,
    isPro: false,
  },
  {
    name: 'Gold',
    price: 'R$ 49,90',
    duration: '7 dias',
    ideal: 'Festas prolongadas e eventos temáticos',
    buttonText: 'Comprar Gold',
    isPopular: false,
    isPro: false,
  },
  {
    name: 'Platinum',
    price: 'R$ 99,90',
    period: ' / mês',
    duration: '30 dias',
    ideal: 'Uso recorrente em estabelecimentos',
    buttonText: 'Assinar Platinum',
    isPopular: true,
    isPro: false,
  },
  {
    name: 'Pro',
    price: 'R$ 499,90',
    period: ' / ano',
    duration: '365 dias',
    ideal: 'Profissionais e casas de eventos',
    buttonText: 'Assinar Pro',
    isPopular: false,
    isPro: true,
  },
];

export default function PlanosPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    // For now, redirect to the interest form
    // This will be replaced with payment integration
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-landing-dark mb-4">
              Escolha o plano <span className="text-landing-orange">ideal</span> para você
            </h1>
            <p className="text-landing-dark/60 text-lg max-w-2xl mx-auto">
              Todos os planos incluem todas as funcionalidades. A única diferença é o tempo de acesso.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PlanCard
                  {...plan}
                  onSelect={() => handleSelectPlan(plan.name)}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-12 max-w-2xl mx-auto"
          >
            <p className="text-landing-dark/60 mb-2">
              <strong>Todos os planos incluem todas as funcionalidades.</strong>
            </p>
            <p className="text-landing-dark/50 text-sm">
              A única diferença é o tempo de acesso. Sem taxas ocultas, sem limitações de uso.
            </p>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
