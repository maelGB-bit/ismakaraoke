import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import mammothLogo from '@/assets/mammoth-logo.png';

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
          {/* Video placeholder */}
          <div className="aspect-video bg-landing-brown/20 rounded-2xl border-2 border-dashed border-landing-brown/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-landing-orange/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-landing-orange rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-landing-orange/30">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <img 
                src={mammothLogo} 
                alt="Mamute" 
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <p className="text-white/70 font-medium">Vídeo do mascote explicando</p>
              <p className="text-white/40 text-sm">(Em breve)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
