import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Send, Star } from 'lucide-react';

interface VoteSliderProps {
  onSubmit: (nota: number) => void;
  isSubmitting: boolean;
}

export function VoteSlider({ onSubmit, isSubmitting }: VoteSliderProps) {
  const [nota, setNota] = useState(5);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'neon-text-gold';
    if (score >= 5) return 'neon-text-cyan';
    return 'neon-text-pink';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-card p-6 mb-6">
        <p className="text-center text-muted-foreground text-sm uppercase tracking-widest mb-6">
          Sua Nota
        </p>

        <div className="flex justify-center items-center gap-2 mb-8">
          <Star className="w-8 h-8 text-accent" fill="currentColor" />
          <motion.span
            key={nota}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`text-7xl font-black font-display ${getScoreColor(nota)}`}
          >
            {nota}
          </motion.span>
        </div>

        <div className="px-4 mb-8">
          <Slider
            value={[nota]}
            onValueChange={(values) => setNota(values[0])}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => onSubmit(nota)}
        disabled={isSubmitting}
        size="lg"
        className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 neon-glow-pink"
      >
        <Send className="mr-2 h-5 w-5" />
        {isSubmitting ? 'Enviando...' : 'Enviar Meu Voto'}
      </Button>
    </motion.div>
  );
}
