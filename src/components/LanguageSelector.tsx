import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { languages, Language } from '@/i18n/translations';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';

export function LanguageSelector() {
  const { setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);

  const handleContinue = () => {
    if (selectedLang) {
      setLanguage(selectedLang);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-block mb-6"
        >
          <div className="relative">
            <Globe className="w-20 h-20 text-primary animate-float" />
            <div className="absolute inset-0 w-20 h-20 bg-primary/20 blur-2xl rounded-full" />
          </div>
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black font-display mb-3">
          <span className="neon-text-pink">KARAOKE</span>{' '}
          <span className="neon-text-cyan">VOTING</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('language.select')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl w-full mb-8"
      >
        {languages.map((lang, index) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            onClick={() => setSelectedLang(lang.code)}
            className={`glass-card p-5 flex flex-col items-center gap-3 group hover:scale-105 transition-all cursor-pointer relative ${
              selectedLang === lang.code 
                ? 'border-primary border-2 neon-glow-pink' 
                : 'border-border/50'
            }`}
          >
            {selectedLang === lang.code && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2"
              >
                <Check className="w-5 h-5 text-primary" />
              </motion.div>
            )}
            <span className="text-5xl">{lang.flag}</span>
            <span className="text-lg font-bold font-display">{lang.name}</span>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={handleContinue}
          disabled={!selectedLang}
          size="lg"
          className="text-lg px-12 py-6 font-bold bg-primary hover:bg-primary/90 neon-glow-pink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('language.continue')}
        </Button>
      </motion.div>
    </div>
  );
}
