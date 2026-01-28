import { motion } from 'framer-motion';
import { QrCode, Search, Mic2, ThumbsUp } from 'lucide-react';

const steps = [
  {
    icon: QrCode,
    title: 'Leia o QR Code',
    description: 'Escaneie com seu celular e acesse o sistema instantaneamente.',
  },
  {
    icon: Search,
    title: 'Busque músicas',
    description: 'Pesquise entre milhares de vídeos musicais disponíveis online.',
  },
  {
    icon: Mic2,
    title: 'Cante no palco',
    description: 'Quando for sua vez, suba ao palco e solte a voz!',
  },
  {
    icon: ThumbsUp,
    title: 'Vote pelo celular',
    description: 'Avalie as apresentações e veja o ranking em tempo real.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-landing-light relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-landing-dark mb-4">
            Como <span className="text-landing-orange">Funciona</span>
          </h2>
          <p className="text-landing-dark/60 max-w-2xl mx-auto">
            Em 4 passos simples, você transforma qualquer momento em uma experiência musical inesquecível.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-landing-brown/10">
                <div className="w-14 h-14 bg-landing-orange/10 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-landing-orange" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-landing-orange text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-landing-dark text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-landing-dark/60 text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
