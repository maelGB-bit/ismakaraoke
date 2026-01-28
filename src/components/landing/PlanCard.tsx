import { Check, Trophy, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  duration: string;
  ideal: string;
  buttonText: string;
  isPopular?: boolean;
  isPro?: boolean;
  onSelect: () => void;
}

const features = [
  'Busca de vídeos musicais públicos',
  'Fila organizada',
  'Votação pelo celular',
  'Ranking em tempo real',
  'Telão para projeção',
  'QR Code de acesso',
  'Sem instalar nada',
];

export function PlanCard({
  name,
  price,
  period,
  duration,
  ideal,
  buttonText,
  isPopular,
  isPro,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-6 transition-all',
        isPro
          ? 'bg-gradient-to-br from-landing-orange to-landing-brown text-white shadow-xl shadow-landing-orange/20 scale-105'
          : isPopular
          ? 'bg-white border-2 border-landing-orange shadow-lg'
          : 'bg-white border border-landing-brown/20 shadow-md'
      )}
    >
      {/* Badges */}
      {isPopular && !isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-landing-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            Mais Popular
          </span>
        </div>
      )}
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-white text-landing-orange text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Melhor Custo-Benefício
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3',
          isPro ? 'bg-white/20' : 'bg-landing-orange/10'
        )}>
          {isPro ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : isPopular ? (
            <Crown className="w-6 h-6 text-landing-orange" />
          ) : (
            <Star className="w-6 h-6 text-landing-orange" />
          )}
        </div>
        <h3 className={cn(
          'text-xl font-display font-bold mb-2',
          isPro ? 'text-white' : 'text-landing-dark'
        )}>
          {name}
        </h3>
        <div className="mb-2">
          <span className={cn(
            'text-3xl font-bold',
            isPro ? 'text-white' : 'text-landing-dark'
          )}>
            {price}
          </span>
          {period && (
            <span className={cn(
              'text-sm',
              isPro ? 'text-white/70' : 'text-landing-dark/50'
            )}>
              {period}
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm',
          isPro ? 'text-white/70' : 'text-landing-dark/50'
        )}>
          Tempo de acesso: <strong>{duration}</strong>
        </p>
        <p className={cn(
          'text-xs mt-1',
          isPro ? 'text-white/60' : 'text-landing-dark/40'
        )}>
          Ideal para: {ideal}
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={cn(
              'w-4 h-4 flex-shrink-0 mt-0.5',
              isPro ? 'text-white' : 'text-landing-orange'
            )} />
            <span className={cn(
              'text-sm',
              isPro ? 'text-white/80' : 'text-landing-dark/70'
            )}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <Button
        onClick={onSelect}
        className={cn(
          'w-full font-semibold',
          isPro
            ? 'bg-white text-landing-orange hover:bg-white/90'
            : isPopular
            ? 'bg-landing-orange text-white hover:bg-landing-orange/90'
            : 'bg-landing-dark/10 text-landing-dark hover:bg-landing-dark/20'
        )}
      >
        {buttonText}
      </Button>
    </div>
  );
}
