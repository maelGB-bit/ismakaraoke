import { motion } from 'framer-motion';
import { Music, Globe, Headphones } from 'lucide-react';
import { SiteYouTubePlayer } from './SiteYouTubePlayer';

export function MusicVarietySection() {
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
              Variedade de <span className="text-landing-orange">Músicas</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              O sistema permite pesquisar e selecionar entre uma enorme variedade de vídeos musicais 
              públicos disponíveis online, atendendo diversos estilos musicais — do sertanejo ao rock, 
              do pop ao MPB, do funk ao gospel.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Music className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">Milhares</p>
                  <p className="text-white/50 text-sm">de músicas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Globe className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">Nacional</p>
                  <p className="text-white/50 text-sm">e internacional</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Headphones className="w-8 h-8 text-landing-orange" />
                <div>
                  <p className="text-white font-semibold">Todos</p>
                  <p className="text-white/50 text-sm">os estilos</p>
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
              placeholderText="Em breve vídeo explicativo"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
