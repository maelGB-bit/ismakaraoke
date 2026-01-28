import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center pt-20 pb-16 overflow-hidden">
      <section className="hero-banner">
        <picture>
          <source
            srcSet="/img/mamute-banner-desktop.png"
            media="(min-width: 1024px)"
          />
          <source
            srcSet="/img/mamute-banner-tablet.png"
            media="(min-width: 768px)"
          />
          <img
            src="/img/mamute-banner-mobile.png"
            alt="Mamute Karaoke - Transforme qualquer evento em um karaokê interativo!"
            className="hero-banner-image"
          />
        </picture>
      </section>

      <div className="container mx-auto px-4 relative z-10 mt-6">
        <div className="max-w-3xl mx-auto text-center text-white/90 space-y-3 text-base sm:text-lg">
          <p>Sem filas, sem papel, sem pularem sua vez e sem confusão. Todos cantam de forma justa!!</p>
          <p>Um karaokê organizado e divertido para qualquer evento, festa ou até para usar em casa.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 mt-8">
        <div className="max-w-4xl mx-auto text-center">
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
