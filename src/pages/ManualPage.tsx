import { motion } from 'framer-motion';
import { Settings, Users, Check, Monitor, ListOrdered, Play, Vote, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SiteYouTubePlayer } from '@/components/landing/SiteYouTubePlayer';

const coordinatorSteps = [
  { icon: Settings, title: 'Criar e abrir evento', description: 'Acesse o sistema e crie uma nova sessão de karaokê.' },
  { icon: Monitor, title: 'Exibir o painel no telão', description: 'Conecte a uma TV ou projetor para todos acompanharem.' },
  { icon: ListOrdered, title: 'Controlar ordem das músicas', description: 'Organize a fila conforme necessário.' },
  { icon: Play, title: 'Autorizar/pular apresentações', description: 'Inicie quando o cantor estiver pronto.' },
  { icon: Vote, title: 'Monitorar inscritos e votos', description: 'Acompanhe tudo em tempo real.' },
  { icon: Trophy, title: 'Encerrar e salvar resultados', description: 'Finalize o evento e veja o ranking final.' },
];

const userSteps = [
  {
    title: 'Inscrição',
    items: [
      'Acesse via QR Code exibido no evento',
      'Busque a música desejada',
      'Inscreva seu nome e aguarde na fila',
    ],
  },
  {
    title: 'Votação',
    items: [
      'Após cada apresentação, o sistema abre votação',
      'Vote com notas de 0 a 10',
      'Seja justo e divirta-se!',
    ],
  },
  {
    title: 'Ranking',
    items: [
      'Atualização automática após cada votação',
      'Acompanhe quem está liderando',
      'Torça pelo seu favorito!',
    ],
  },
];

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-landing-dark mb-4">
              Manual de <span className="text-landing-orange">Uso</span>
            </h1>
            <p className="text-landing-dark/60 text-lg max-w-2xl mx-auto">
              Aprenda a usar o Mamute Karaokê em poucos minutos.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="coordinator" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white border border-landing-brown/20">
                <TabsTrigger 
                  value="coordinator"
                  className="data-[state=active]:bg-landing-orange data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Coordenador
                </TabsTrigger>
                <TabsTrigger 
                  value="user"
                  className="data-[state=active]:bg-landing-orange data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="coordinator">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-landing-brown/10"
                >
                  <h2 className="text-2xl font-display font-bold text-landing-dark mb-6">
                    Manual do Coordenador
                  </h2>
                  
                  {/* Video Section */}
                  <div className="mb-8">
                    <SiteYouTubePlayer 
                      videoKey="tutorial_coordinator" 
                      placeholderText="Em breve vídeo explicativo"
                      className="border border-landing-brown/10"
                    />
                  </div>

                  <p className="text-landing-dark/60 mb-8">
                    O organizador pode controlar todo o evento pelo painel. Requisitos: Notebook/PC + Internet (HDMI opcional para telão).
                  </p>
                  
                  <div className="space-y-4">
                    {coordinatorSteps.map((step, index) => (
                      <div 
                        key={step.title}
                        className="flex items-start gap-4 p-4 bg-landing-light rounded-xl"
                      >
                        <div className="w-10 h-10 bg-landing-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <step.icon className="w-5 h-5 text-landing-orange" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-landing-dark">{step.title}</h4>
                          <p className="text-sm text-landing-dark/60">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="user">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-landing-brown/10"
                >
                  <h2 className="text-2xl font-display font-bold text-landing-dark mb-6">
                    Manual do Usuário
                  </h2>

                  {/* Video Section */}
                  <div className="mb-8">
                    <SiteYouTubePlayer 
                      videoKey="tutorial_participant" 
                      placeholderText="Em breve vídeo explicativo"
                      className="border border-landing-brown/10"
                    />
                  </div>

                  <p className="text-landing-dark/60 mb-8">
                    Participar é muito fácil! Basta ter um celular com acesso à internet.
                  </p>
                  
                  <div className="grid gap-6 md:grid-cols-3">
                    {userSteps.map((section, index) => (
                      <div 
                        key={section.title}
                        className="bg-landing-light rounded-xl p-5"
                      >
                        <div className="w-8 h-8 bg-landing-orange text-white rounded-full flex items-center justify-center font-bold text-sm mb-3">
                          {index + 1}
                        </div>
                        <h4 className="font-semibold text-landing-dark mb-3">{section.title}</h4>
                        <ul className="space-y-2">
                          {section.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-landing-dark/60">
                              <Check className="w-4 h-4 text-landing-orange flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
