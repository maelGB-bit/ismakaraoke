import { motion } from 'framer-motion';
import { 
  PartyPopper, Building2, GraduationCap, Store, Mic, 
  Moon, Church, Users, Heart 
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export function TargetAudienceSection() {
  const { t } = useLanguage();

  const audiences = [
    { icon: PartyPopper, label: t('landing.audience.parties') },
    { icon: Building2, label: t('landing.audience.corporate') },
    { icon: GraduationCap, label: t('landing.audience.schools') },
    { icon: Store, label: t('landing.audience.businesses') },
    { icon: Mic, label: t('landing.audience.proKaraoke') },
    { icon: Moon, label: t('landing.audience.nightclubs') },
    { icon: Church, label: t('landing.audience.communities') },
    { icon: Users, label: t('landing.audience.congresses') },
    { icon: Heart, label: t('landing.audience.celebrations') },
  ];

  return (
    <section className="py-20 bg-landing-dark">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t('landing.audience.title')} <span className="text-landing-orange">{t('landing.audience.titleHighlight')}</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('landing.audience.subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 bg-white/5 hover:bg-landing-orange/10 border border-white/10 hover:border-landing-orange/30 rounded-full px-5 py-3 transition-all cursor-default"
            >
              <audience.icon className="w-5 h-5 text-landing-orange" />
              <span className="text-white/80 text-sm font-medium">{audience.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
