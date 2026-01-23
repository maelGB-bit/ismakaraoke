import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Users, Trophy, ArrowRight, Music, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { languages } from '@/i18n/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Index() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  const features = [
    {
      icon: Mic2,
      title: t('menu.host'),
      description: t('menu.host.desc'),
      path: '/host',
      color: 'text-primary',
      glow: 'neon-glow-pink',
    },
    {
      icon: Music,
      title: t('menu.signup'),
      description: t('menu.signup.desc'),
      path: '/inscricao',
      color: 'text-neon-green',
      glow: '',
    },
    {
      icon: Users,
      title: t('menu.vote'),
      description: t('menu.vote.desc'),
      path: '/vote',
      color: 'text-secondary',
      glow: '',
    },
    {
      icon: Trophy,
      title: t('menu.ranking'),
      description: t('menu.ranking.desc'),
      path: '/ranking',
      color: 'text-accent',
      glow: 'neon-glow-gold',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="text-xl">{currentLang?.flag}</span>
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={language === lang.code ? 'bg-primary/20' : ''}
              >
                <span className="mr-2 text-lg">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-block mb-6"
        >
          <div className="relative">
            <Mic2 className="w-24 h-24 text-primary animate-float" />
            <div className="absolute inset-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black font-display mb-4">
          <span className="neon-text-pink">KARAOKE</span>{' '}
          <span className="neon-text-cyan">VOTING</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          {t('app.subtitle')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Button
              onClick={() => navigate(feature.path)}
              variant="outline"
              className={`glass-card w-full h-auto p-6 flex flex-col items-center gap-4 group hover:scale-105 transition-transform ${feature.glow}`}
            >
              <feature.icon className={`w-12 h-12 ${feature.color}`} />
              <div className="text-center">
                <h2 className="text-2xl font-bold font-display mb-1">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        {t('app.madeWith')}
      </motion.p>
    </div>
  );
}
