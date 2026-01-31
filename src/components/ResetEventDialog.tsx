import { useState } from 'react';
import { Download, Loader2, AlertTriangle, Trash2, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

interface ResetEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceName: string;
  instanceCode: string;
  onResetComplete: () => void;
}

export function ResetEventDialog({
  open,
  onOpenChange,
  instanceId,
  instanceName,
  instanceCode,
  onResetComplete,
}: ResetEventDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [exportRanking, setExportRanking] = useState(true);
  const [exportParticipants, setExportParticipants] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveEventArchive = async () => {
    try {
      // Fetch performances for archive
      const { data: performances, error: perfError } = await supabase
        .from('performances')
        .select('cantor, musica, nota_media, total_votos')
        .eq('karaoke_instance_id', instanceId)
        .eq('status', 'encerrada')
        .order('nota_media', { ascending: false });

      if (perfError) throw perfError;

      if (!performances || performances.length === 0) {
        console.log('No performances to archive');
        return;
      }

      // Save archive to database for admin access
      const { error: archiveError } = await supabase
        .from('event_archives')
        .insert({
          karaoke_instance_id: instanceId,
          instance_name: instanceName,
          instance_code: instanceCode,
          event_date: new Date().toISOString(),
          rankings: performances.map((p, idx) => ({
            posicao: idx + 1,
            cantor: p.cantor,
            musica: p.musica,
            nota_media: Number(p.nota_media) || 0,
            total_votos: p.total_votos || 0,
          })),
        });

      if (archiveError) {
        console.error('Error saving archive:', archiveError);
        throw archiveError;
      }

      console.log('Event archive saved successfully');
    } catch (error) {
      console.error('Error in saveEventArchive:', error);
      // Don't throw - archive saving shouldn't block reset
    }
  };

  const handleExportAndReset = async () => {
    setIsProcessing(true);

    try {
      // Always save archive for admin
      await saveEventArchive();

      // Export ranking if selected
      if (exportRanking) {
        const { data: performances } = await supabase
          .from('performances')
          .select('cantor, musica, nota_media, total_votos, created_at')
          .eq('karaoke_instance_id', instanceId)
          .eq('status', 'encerrada')
          .order('nota_media', { ascending: false });

        if (performances && performances.length > 0) {
          const headers = ['Posição', 'Cantor', 'Música', 'Nota Média', 'Total Votos', 'Data'];
          const rows = performances.map((p, idx) => [
            (idx + 1).toString(),
            p.cantor,
            p.musica,
            (p.nota_media || 0).toString(),
            (p.total_votos || 0).toString(),
            new Date(p.created_at).toLocaleString('pt-BR'),
          ]);
          const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
          downloadCSV(csvContent, `ranking_${instanceCode}_${new Date().toISOString().split('T')[0]}.csv`);
        }
      }

      // Export participants if selected
      if (exportParticipants) {
        const { data: participants } = await supabase
          .from('participants')
          .select('name, phone, email, created_at')
          .eq('karaoke_instance_id', instanceId)
          .order('created_at', { ascending: true });

        if (participants && participants.length > 0) {
          const headers = ['Nome', 'Telefone', 'Email', 'Data Cadastro'];
          const rows = participants.map(p => [
            p.name,
            p.phone,
            p.email,
            new Date(p.created_at).toLocaleString('pt-BR'),
          ]);
          const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
          downloadCSV(csvContent, `participantes_${instanceCode}_${new Date().toISOString().split('T')[0]}.csv`);
        }
      }

      // Now perform the reset
      await supabase.from('votes').delete().eq('karaoke_instance_id', instanceId);
      await supabase.from('performances').delete().eq('karaoke_instance_id', instanceId);
      await supabase.from('waitlist').delete().eq('karaoke_instance_id', instanceId);

      toast({ title: t('host.eventReset'), description: t('host.allDataDeleted') });
      onResetComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error during reset:', error);
      toast({ title: t('host.error'), description: t('host.cantResetEvent'), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('host.resetEvent')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Tem certeza que deseja resetar o evento? Esta ação irá apagar todas as performances, votos e a fila de espera.
              </p>

              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Atenção: Após esta ação os dados do ranking não estarão mais disponíveis para você.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Exportar antes de resetar:</p>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exportRanking"
                    checked={exportRanking}
                    onCheckedChange={(checked) => setExportRanking(!!checked)}
                  />
                  <label htmlFor="exportRanking" className="text-sm flex items-center gap-2 cursor-pointer">
                    <Trophy className="h-4 w-4 text-primary" />
                    Exportar Ranking (CSV)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exportParticipants"
                    checked={exportParticipants}
                    onCheckedChange={(checked) => setExportParticipants(!!checked)}
                  />
                  <label htmlFor="exportParticipants" className="text-sm flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4 text-primary" />
                    Exportar Participantes (CSV)
                  </label>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <Button
            onClick={handleExportAndReset}
            disabled={isProcessing}
            variant="destructive"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {exportRanking || exportParticipants ? 'Exportar e Resetar' : 'Resetar Evento'}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
