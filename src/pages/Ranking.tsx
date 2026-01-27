import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Vote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RankingCard } from '@/components/RankingCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { InstanceNotFound } from '@/components/InstanceNotFound';
import { useRanking } from '@/hooks/usePerformance';
import { useInstanceByCode } from '@/hooks/useInstanceByCode';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Ranking() {
  const navigate = useNavigate();
  const { instanceCode } = useParams<{ instanceCode?: string }>();
  const { t } = useLanguage();
  
  // If instanceCode is provided, look up the instance
  const { instance, loading: instanceLoading, error: instanceError } = useInstanceByCode(instanceCode);
  const instanceId = instance?.id || null;
  
  const { performances, loading } = useRanking(instanceId);

  // Instance not found (only when instanceCode was provided)
  if (instanceCode && instanceError) {
    return <InstanceNotFound instanceCode={instanceCode} error={instanceError} />;
  }

  return (
    <div className="min-h-screen gradient-bg p-4 lg:p-8 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <header className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy className="w-16 h-16 mx-auto text-accent mb-4" />
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-black font-display neon-text-gold">
            {t('ranking.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('ranking.subtitle')}
          </p>
          {instance && (
            <p className="text-sm text-primary mt-1">
              {instance.name}
            </p>
          )}
        </header>

        {/* Ranking List */}
        <div className="space-y-4 mb-8">
          {loading || instanceLoading ? (
            <div className="glass-card p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t('ranking.loading')}</p>
            </div>
          ) : performances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <p className="text-muted-foreground text-lg">
                {t('ranking.noPerformances')}
              </p>
              <p className="text-muted-foreground mt-2">
                {t('ranking.performancesWillShow')}
              </p>
            </motion.div>
          ) : (
            performances.map((perf, index) => (
              <RankingCard
                key={perf.id}
                performance={perf}
                position={index + 1}
                isFirst={index === 0}
              />
            ))
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(instanceCode ? `/vote/${instanceCode}` : '/vote')}
            size="lg"
            className="w-full max-w-md"
          >
            <Vote className="mr-2 h-5 w-5" />
            {t('ranking.goToVoting')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
