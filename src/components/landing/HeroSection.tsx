import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mammothLogo from '@/assets/mammoth-logo.png';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-landing-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-landing-orange/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-landing-brown/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Mascot */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <img 
                src={mammothLogo} 
                alt="Mamute Karaoke" 
                className="w-24 h-24 md:w-32 md:h-32 mx-auto animate-float"
              />
              <div className="absolute inset-0 bg-landing-orange/30 blur-2xl rounded-full" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white mb-6 leading-tight"
          >
            Transforme qualquer evento em um{' '}
            <span className="text-landing-orange">karaokê interativo!</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 mb-4 max-w-2xl mx-auto"
          >
            Cante, vote e participe usando apenas o seu celular — sem filas, sem papel e sem confusão.
          </motion.p>

          {/* Positioning */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-md text-white/50 mb-8 max-w-xl mx-auto italic"
          >
            Um karaokê organizado e divertido para qualquer evento, festa ou até para usar em casa.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/testar">
              <Button size="lg" className="bg-landing-orange hover:bg-landing-orange/90 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg shadow-landing-orange/30">
                <Sparkles className="mr-2" />
                Quero testar agora
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-full">
                <Play className="mr-2" />
                Ver como funciona
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-landing-orange rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}
