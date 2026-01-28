import { motion } from 'framer-motion';
import { QrCode, Search, Mic2, ThumbsUp, Monitor, Trophy } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { CTASection } from '@/components/landing/CTASection';

const steps = [
  {
    icon: QrCode,
    title: 'Acesso via QR Code',
    description: 'Os participantes escaneiam o QR Code com o celular e acessam o sistema instantaneamente. Funciona em qualquer ambiente: eventos, estabelecimentos e até festas em casa.',
  },
  {
    icon: Search,
    title: 'Busca de músicas',
    description: 'O participante pode pesquisar e selecionar entre uma grande variedade de vídeos musicais públicos disponíveis online. Milhares de opções em diversos estilos musicais.',
  },
  {
    icon: Mic2,
    title: 'Fila organizada',
    description: 'Todas as inscrições ficam organizadas em uma fila digital. Sem papelzinho, sem confusão. O coordenador controla tudo pelo painel.',
  },
  {
    icon: Monitor,
    title: 'Telão / Painel',
    description: 'Nome, música e ordem são exibidos no painel para manter tudo organizado. Conecte a um telão ou TV para que todos acompanhem.',
  },
  {
    icon: ThumbsUp,
    title: 'Votação interativa',
    description: 'Após cada apresentação, todos votam pelo celular com notas de 0 a 10. Sistema justo e democrático.',
  },
  {
    icon: Trophy,
    title: 'Ranking em tempo real',
    description: 'O ranking é atualizado automaticamente após cada votação. Todos podem acompanhar quem está liderando!',
  },
];

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-landing-dark mb-4">
              Como o Mamute Karaokê <span className="text-landing-orange">funciona</span>
            </h1>
            <p className="text-landing-dark/60 text-lg max-w-2xl mx-auto">
              Tecnologia simples + experiência divertida = eventos memoráveis
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col md:flex-row items-start gap-6 bg-white rounded-2xl p-6 md:p-8 shadow-md border border-landing-brown/10"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-landing-orange/10 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-landing-orange" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 bg-landing-orange text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-display font-bold text-landing-dark">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-landing-dark/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <CTASection />
      <LandingFooter />
    </div>
  );
}
