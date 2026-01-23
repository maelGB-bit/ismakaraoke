import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Users, Trophy, ArrowRight, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic2,
      title: 'Host',
      description: 'Controle a apresentação, exiba o vídeo e acompanhe as notas',
      path: '/host',
      color: 'text-primary',
      glow: 'neon-glow-pink',
    },
    {
      icon: Music,
      title: 'Inscrição',
      description: 'Escolha sua música e entre na fila para cantar',
      path: '/inscricao',
      color: 'text-neon-green',
      glow: '',
    },
    {
      icon: Users,
      title: 'Votar',
      description: 'Acesse via QR Code para dar sua nota',
      path: '/vote',
      color: 'text-secondary',
      glow: '',
    },
    {
      icon: Trophy,
      title: 'Ranking',
      description: 'Veja o ranking das melhores performances da noite',
      path: '/ranking',
      color: 'text-accent',
      glow: 'neon-glow-gold',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-block mb-6"
        >
          <div className="relative">
            <Mic2 className="w-24 h-24 text-primary animate-float" />
            <div className="absolute inset-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black font-display mb-4">
          <span className="neon-text-pink">KARAOKÊ</span>{' '}
          <span className="neon-text-cyan">VOTING</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Sistema de votação ao vivo para suas noites de karaokê
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Button
              onClick={() => navigate(feature.path)}
              variant="outline"
              className={`glass-card w-full h-auto p-6 flex flex-col items-center gap-4 group hover:scale-105 transition-transform ${feature.glow}`}
            >
              <feature.icon className={`w-12 h-12 ${feature.color}`} />
              <div className="text-center">
                <h2 className="text-2xl font-bold font-display mb-1">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        Feito com 🎤 para animar suas festas
      </motion.p>
    </div>
  );
}
