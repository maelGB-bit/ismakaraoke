import { motion } from 'framer-motion';
import { Check, Users, Settings } from 'lucide-react';

const organizerBenefits = [
  'Engaja os participantes',
  'Mantém o público por mais tempo',
  'Funciona em festas, eventos e estabelecimentos',
  'Controle total da fila e das apresentações',
  'Sem papel e sem bagunça',
];

const participantBenefits = [
  'Seleciona músicas pelo celular',
  'Vota ao vivo',
  'Ranking transparente e divertido',
  'Todos participam',
  'Experiência interativa',
];

export function BenefitsSection() {
  return (
    <section className="py-20 bg-landing-light">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-landing-dark mb-4">
            Benefícios para <span className="text-landing-orange">Todos</span>
          </h2>
          <p className="text-landing-dark/60 max-w-2xl mx-auto">
            Seja você o organizador ou participante, o Mamute Karaoke traz vantagens para todos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Organizers */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-md border border-landing-brown/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-landing-orange/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-landing-orange" />
              </div>
              <h3 className="text-xl font-display font-bold text-landing-dark">
                Para quem organiza
              </h3>
            </div>
            <ul className="space-y-4">
              {organizerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-landing-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-landing-orange" />
                  </div>
                  <span className="text-landing-dark/70">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* For Participants */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-md border border-landing-brown/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-landing-brown/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-landing-brown" />
              </div>
              <h3 className="text-xl font-display font-bold text-landing-dark">
                Para quem participa
              </h3>
            </div>
            <ul className="space-y-4">
              {participantBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-landing-brown/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-landing-brown" />
                  </div>
                  <span className="text-landing-dark/70">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
