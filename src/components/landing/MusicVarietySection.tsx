import { motion } from 'framer-motion';
import { Music, Globe, Headphones } from 'lucide-react';
import { SiteYouTubePlayer } from './SiteYouTubePlayer';
import { useLanguage } from '@/i18n/LanguageContext';

export function MusicVarietySection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-landing-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-landing-orange/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              {t('landing.musicVariety.title')} <span className="text-landing-orange">{t('landing.musicVariety.titleHighlight')}</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              {t('landing.musicVariety.subtitle')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Music className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">{t('landing.musicVariety.thousands')}</p>
                  <p className="text-white/50 text-sm">{t('landing.musicVariety.ofSongs')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Globe className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">{t('landing.musicVariety.national')}</p>
                  <p className="text-white/50 text-sm">{t('landing.musicVariety.international')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Headphones className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">{t('landing.musicVariety.all')}</p>
                  <p className="text-white/50 text-sm">{t('landing.musicVariety.styles')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <SiteYouTubePlayer 
              videoKey="music_variety" 
              placeholderText={t('landing.video.placeholder')}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
