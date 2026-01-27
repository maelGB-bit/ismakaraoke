import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface InstanceNotFoundProps {
  instanceCode?: string;
  error?: string;
}

export function InstanceNotFound({ instanceCode, error }: InstanceNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-display mb-2">
          Evento Não Encontrado
        </h1>
        {instanceCode && (
          <p className="text-muted-foreground mb-2">
            Código: <span className="font-mono font-bold">{instanceCode}</span>
          </p>
        )}
        <p className="text-muted-foreground mb-6">
          {error || 'Este evento não existe ou não está mais ativo.'}
        </p>
        <Button onClick={() => navigate('/')} className="w-full">
          <Home className="mr-2 h-4 w-4" />
          Voltar ao Início
        </Button>
      </motion.div>
    </div>
  );
}
