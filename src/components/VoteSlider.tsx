import { motion } from 'framer-motion';
import { Star, Send, Music } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/i18n/LanguageContext';

interface VoteSliderProps {
  onSubmit: (nota: number) => void;
  isSubmitting?: boolean;
}

export function VoteSlider({ onSubmit, isSubmitting }: VoteSliderProps) {
  const [nota, setNota] = useState(7);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { instanceCode } = useParams<{ instanceCode?: string }>();

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-destructive';
    if (score <= 6) return 'text-accent';
    return 'neon-text-gold';
  };

  return (
    <div className="glass-card p-8 max-w-md mx-auto">
      <div className="text-center">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">
          {t('slider.yourScore')}
        </p>
        <div className="flex justify-center items-center gap-2 mb-8">
          <Star className="w-8 h-8 text-accent" fill="currentColor" />
          <motion.span key={nota} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={`text-7xl font-black font-display ${getScoreColor(nota)}`}>
            {nota}
          </motion.span>
        </div>
        <div className="px-4 mb-8">
          <Slider value={[nota]} onValueChange={(values) => setNota(values[0])} min={0} max={10} step={1} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button onClick={() => onSubmit(nota)} disabled={isSubmitting} size="lg" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 neon-glow-pink">
          <Send className="mr-2 h-5 w-5" />
          {isSubmitting ? t('slider.submitting') : t('slider.submitVote')}
        </Button>
        <Button 
          onClick={() => navigate(instanceCode ? `/app/inscricao/${instanceCode}` : '/app/inscricao')} 
          variant="outline" 
          size="lg" 
          className="w-full"
        >
          <Music className="mr-2 h-5 w-5" />
          {t('vote.wantToSing')}
        </Button>
      </div>
    </div>
  );
}
