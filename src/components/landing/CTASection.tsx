import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-landing-orange via-landing-orange to-landing-brown relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Quer testar no seu evento ou festa?
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed">
            Crie sua conta em poucos minutos e transforme seu evento com música e diversão.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/testar">
              <Button 
                size="lg" 
                className="bg-white text-landing-orange hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-lg"
              >
                <Sparkles className="mr-2" />
                Quero testar agora
              </Button>
            </Link>
            <Link to="/planos">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-full"
              >
                Ver planos
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
