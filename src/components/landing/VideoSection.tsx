import { motion } from 'framer-motion';
import { SiteYouTubePlayer } from './SiteYouTubePlayer';

export function VideoSection() {
  return (
    <section className="py-20 bg-landing-dark relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-landing-dark via-landing-dark/95 to-landing-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-landing-orange/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Veja como funciona <span className="text-landing-orange">na prática</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Assista ao vídeo e entenda como o karaokê pode ser simples, organizado e divertido.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <SiteYouTubePlayer 
            videoKey="how_it_works" 
            placeholderText="Vídeo explicativo - Configure no painel admin"
          />
        </motion.div>
      </div>
    </section>
  );
}
