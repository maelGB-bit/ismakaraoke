import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PlanCard } from '@/components/landing/PlanCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  duration_hours: number;
  stripe_price_id: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
}

const formatDuration = (hours: number) => {
  if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
  if (hours < 168) return `${Math.floor(hours / 24)} dia${hours >= 48 ? 's' : ''}`;
  if (hours < 720) return `${Math.floor(hours / 168)} semana${hours >= 336 ? 's' : ''}`;
  if (hours < 8760) return `${Math.floor(hours / 720)} ${hours >= 1440 ? 'meses' : 'mês'}`;
  return `${Math.floor(hours / 8760)} ano${hours >= 17520 ? 's' : ''}`;
};

const getIdealText = (plan: Plan) => {
  if (plan.is_free) return 'Testar rapidamente o sistema';
  if (plan.duration_hours <= 24) return 'Eventos únicos e festas pontuais';
  if (plan.duration_hours <= 168) return 'Festas prolongadas e eventos temáticos';
  if (plan.is_recurring && plan.recurring_interval === 'month') return 'Uso recorrente em estabelecimentos';
  if (plan.is_recurring && plan.recurring_interval === 'year') return 'Profissionais e casas de eventos';
  return plan.description || '';
};

export default function PlanosPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setPlans(data);
      }
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.is_free) {
      // Free plan - go to trial registration
      navigate('/app/cadastro');
    } else {
      // Paid plan - go to checkout page with plan info
      navigate(`/checkout/${plan.id}`);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const getPeriodText = (plan: Plan) => {
    if (!plan.is_recurring) return undefined;
    return plan.recurring_interval === 'month' ? ' / mês' : ' / ano';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-landing-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-landing-orange" />
      </div>
    );
  }

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
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PlanCard
                  name={plan.name}
                  price={plan.is_free ? 'R$ 0,00' : formatPrice(plan.price_amount)}
                  period={getPeriodText(plan)}
                  duration={formatDuration(plan.duration_hours)}
                  ideal={getIdealText(plan)}
                  buttonText={plan.is_free ? 'Começar grátis' : `Comprar ${plan.name}`}
                  href={plan.is_free ? '/app/cadastro' : undefined}
                  isPopular={plan.name === 'Platinum'}
                  isPro={plan.name === 'Pro'}
                  onSelect={() => handleSelectPlan(plan)}
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
