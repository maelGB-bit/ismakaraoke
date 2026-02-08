/**
 * Indicadores visuais para itens da fila de espera.
 * Mostra: "Cantou Nx", tempo de espera, badge de cantor novo.
 */
import { Clock, Sparkles, Mic2 } from 'lucide-react';
import type { QueueDisplayInfo } from '@/hooks/useWaitlist';

interface QueueEntryIndicatorsProps {
  info: QueueDisplayInfo;
  /** Compacto: apenas ícones com tooltip. Padrão: false */
  compact?: boolean;
}

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function QueueEntryIndicators({ info, compact = false }: QueueEntryIndicatorsProps) {
  const { songsSung, isNewSinger, waitMinutes, isCoordinatorOverride } = info;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isNewSinger && (
          <span
            title="Cantor novo!"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent/20 text-accent"
          >
            <Sparkles className="w-3 h-3" />
          </span>
        )}
        {songsSung > 0 && (
          <span
            title={`Cantou ${songsSung}x`}
            className="text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded px-1"
          >
            {songsSung}x
          </span>
        )}
        {waitMinutes >= 1 && (
          <span
            title={`Espera ${formatWaitTime(waitMinutes)}`}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
          >
            <Clock className="w-2.5 h-2.5" />
            {formatWaitTime(waitMinutes)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Badge de cantor novo */}
      {isNewSinger && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent bg-accent/15 border border-accent/30 rounded-full px-1.5 py-0.5">
          <Sparkles className="w-2.5 h-2.5" />
          NOVO
        </span>
      )}

      {/* Músicas cantadas */}
      {songsSung > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-1.5 py-0.5">
          <Mic2 className="w-2.5 h-2.5" />
          Cantou {songsSung}x
        </span>
      )}

      {/* Tempo de espera (mostra a partir de 1 minuto) */}
      {waitMinutes >= 1 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/40 rounded-full px-1.5 py-0.5">
          <Clock className="w-2.5 h-2.5" />
          espera {formatWaitTime(waitMinutes)}
        </span>
      )}

      {/* Override do coordenador */}
      {isCoordinatorOverride && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 rounded-full px-1.5 py-0.5">
          ⚡ PRIORIDADE
        </span>
      )}
    </div>
  );
}
