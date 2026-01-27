import { motion } from 'framer-motion';
import { AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface NoInstanceAssignedProps {
  onLogout: () => void;
  userEmail?: string;
}

export function NoInstanceAssigned({ onLogout, userEmail }: NoInstanceAssignedProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <AlertCircle className="w-16 h-16 mx-auto text-accent mb-4" />
        <h1 className="text-2xl font-bold font-display mb-2">
          Aguardando Atribuição
        </h1>
        <p className="text-muted-foreground mb-4">
          Sua conta ainda não foi vinculada a uma instância de karaokê.
        </p>
        {userEmail && (
          <p className="text-sm text-muted-foreground mb-6">
            Logado como: <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          Entre em contato com o administrador para que ele crie e atribua uma instância para você.
        </p>
        <Button onClick={onLogout} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </motion.div>
    </div>
  );
}
