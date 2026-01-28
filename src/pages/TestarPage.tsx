import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Play, CheckCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SiteYouTubePlayer } from '@/components/landing/SiteYouTubePlayer';

const preparationSteps = [
  'Assista os vídeos introdutórios',
  'Confira como acessar via QR Code',
  'Entenda como funciona a fila e votação',
  'Separe o dispositivo que será o "coordenador"',
  'Separe celulares que serão "participantes"',
];

export default function TestarPage() {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeVideo, setActiveVideo] = useState<'coordinator' | 'participant' | null>(null);

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    // Redirect to the trial registration page
    navigate('/app/cadastro');
  };

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
              Testar <span className="text-landing-orange">Gratuitamente</span>
            </h1>
            <p className="text-landing-dark/60 text-lg max-w-2xl mx-auto">
              O plano de teste gratuito oferece <strong>1 hora de uso completo</strong> do sistema 
              com todas as funcionalidades liberadas. Ideal para você entender como tudo funciona na prática 
              antes de escolher um plano.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-8">
            {/* Warning Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-landing-dark text-lg mb-2">
                    ⚠️ Importante: Leia antes de começar
                  </h3>
                  <p className="text-landing-dark/70 leading-relaxed">
                    O tempo de teste começa assim que você entrar na área de uso e dura <strong>apenas 1 hora</strong>. 
                    Por isso, recomendamos fortemente que você assista aos vídeos explicativos antes de iniciar.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Video Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-landing-brown/10"
            >
              <h3 className="font-display font-bold text-landing-dark text-xl mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-landing-orange" />
                Vídeos Explicativos
              </h3>
              <p className="text-landing-dark/60 mb-6">
                Assista aos vídeos para aproveitar ao máximo seu tempo de teste.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveVideo('coordinator')}
                  className="h-auto py-4 border-landing-brown/20 hover:border-landing-orange hover:bg-landing-orange/5 text-landing-dark"
                >
                  <Play className="w-5 h-5 mr-2 text-landing-orange" />
                  <div className="text-left">
                    <p className="font-semibold">Coordenador</p>
                    <p className="text-xs text-landing-dark/50">Como gerenciar o evento</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveVideo('participant')}
                  className="h-auto py-4 border-landing-brown/20 hover:border-landing-orange hover:bg-landing-orange/5 text-landing-dark"
                >
                  <Play className="w-5 h-5 mr-2 text-landing-orange" />
                  <div className="text-left">
                    <p className="font-semibold">Participante</p>
                    <p className="text-xs text-landing-dark/50">Como votar e se inscrever</p>
                  </div>
                </Button>
              </div>
            </motion.div>

            {/* Preparation Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-landing-brown/10"
            >
              <h3 className="font-display font-bold text-landing-dark text-xl mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-landing-orange" />
                Preparação para o teste
              </h3>
              <p className="text-landing-dark/60 mb-6">
                Isso ajuda a não "queimar" o teste. Prepare-se antes de iniciar:
              </p>
              <ul className="space-y-3">
                {preparationSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-landing-orange/10 text-landing-orange rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-landing-dark/70">{step}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <Button
                size="lg"
                onClick={() => setShowConfirmDialog(true)}
                className="bg-landing-orange hover:bg-landing-orange/90 text-white font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-landing-orange/30"
              >
                <Clock className="w-5 h-5 mr-2" />
                Quero testar agora
              </Button>
              <p className="text-landing-dark/50 text-sm mt-4">
                Após iniciar o teste, será exibido um contador regressivo com o tempo restante.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <LandingFooter />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white border-landing-brown/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-landing-dark">
              Confirmar início do teste
            </AlertDialogTitle>
            <AlertDialogDescription className="text-landing-dark/60">
              Confirmo que entendi como o sistema funciona e desejo iniciar meu teste gratuito de <strong>1 hora</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-landing-brown/20">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-landing-orange hover:bg-landing-orange/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar e iniciar teste
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Modal - Coordinator */}
      <Dialog open={activeVideo === 'coordinator'} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-4xl bg-landing-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-display">
              Tutorial para Coordenador
            </DialogTitle>
          </DialogHeader>
          <SiteYouTubePlayer 
            videoKey="tutorial_coordinator" 
            placeholderText="Em breve vídeo explicativo"
          />
        </DialogContent>
      </Dialog>

      {/* Video Modal - Participant */}
      <Dialog open={activeVideo === 'participant'} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-4xl bg-landing-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-display">
              Tutorial para Participante
            </DialogTitle>
          </DialogHeader>
          <SiteYouTubePlayer 
            videoKey="tutorial_participant" 
            placeholderText="Em breve vídeo explicativo"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
