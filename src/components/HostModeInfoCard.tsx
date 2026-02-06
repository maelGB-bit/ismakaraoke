import { motion } from 'framer-motion';
import { Monitor, Info, ListChecks, Settings, Users, Lock, Trash2, FileDown, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface HostModeInfoCardProps {
  onEnterTVMode: () => void;
  isLoading?: boolean;
}

export function HostModeInfoCard({ onEnterTVMode, isLoading }: HostModeInfoCardProps) {
  const { t } = useLanguage();

  const hostOnlyFeatures = [
    { icon: Users, text: 'Inscrever cantores manualmente na fila' },
    { icon: Settings, text: 'Reordenar e editar a fila de espera' },
    { icon: Lock, text: 'Abrir/fechar inscrições' },
    { icon: Trash2, text: 'Remover pessoas da fila' },
    { icon: FileDown, text: 'Exportar dados e rankings' },
    { icon: QrCode, text: 'Visualizar e imprimir QR Code' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border-2 border-primary/30 bg-primary/5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-full bg-primary/20">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">
            Como usar o sistema
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            O <strong>Modo Host</strong> é para preparar e gerenciar o evento. 
            Para conduzir as apresentações, use o <strong>Modo TV</strong>.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-secondary" />
            <span className="font-medium text-sm">Modo Host (gerenciamento)</span>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {hostOnlyFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <feature.icon className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-primary">Modo TV (apresentação)</span>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-primary/70" />
              <span>Exibir vídeos em tela cheia para o público</span>
            </li>
            <li className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-primary/70" />
              <span>Controlar transições entre cantores</span>
            </li>
            <li className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-primary/70" />
              <span>Acompanhar votação em tempo real</span>
            </li>
            <li className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-primary/70" />
              <span>Pular para qualquer cantor da fila</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Button
          onClick={onEnterTVMode}
          disabled={isLoading}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold shadow-lg"
        >
          <Monitor className="mr-2 h-5 w-5" />
          Iniciar Modo TV (Apresentação)
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Dica: Conecte a TV ou projetor e entre no Modo TV para começar o evento
        </p>
      </div>
    </motion.div>
  );
}
