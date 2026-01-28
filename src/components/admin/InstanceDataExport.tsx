import { useState } from 'react';
import { Download, Loader2, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { KaraokeInstance } from '@/types/admin';

interface InstanceDataExportProps {
  instance: KaraokeInstance;
}

export function InstanceDataExport({ instance }: InstanceDataExportProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const downloadParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('name, phone, email, created_at')
        .eq('karaoke_instance_id', instance.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'Nenhum participante cadastrado nesta instância', variant: 'destructive' });
        return;
      }

      // Create CSV
      const headers = ['Nome', 'Telefone', 'Email', 'Data Cadastro'];
      const rows = data.map(p => [
        p.name,
        p.phone,
        p.email,
        new Date(p.created_at).toLocaleString('pt-BR')
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `participantes_${instance.instance_code}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: `${data.length} participantes exportados!` });
    } catch (error) {
      console.error('Error exporting participants:', error);
      toast({ title: 'Erro ao exportar participantes', variant: 'destructive' });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const downloadRanking = async () => {
    setLoadingRanking(true);
    try {
      const { data, error } = await supabase
        .from('performances')
        .select('cantor, musica, nota_media, total_votos, status, created_at')
        .eq('karaoke_instance_id', instance.id)
        .eq('status', 'encerrada')
        .order('nota_media', { ascending: false })
        .order('total_votos', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'Nenhuma performance encerrada nesta instância', variant: 'destructive' });
        return;
      }

      // Create CSV
      const headers = ['Posição', 'Cantor', 'Música', 'Nota Média', 'Total Votos', 'Data'];
      const rows = data.map((p, idx) => [
        (idx + 1).toString(),
        p.cantor,
        p.musica,
        p.nota_media?.toString() || '0',
        p.total_votos?.toString() || '0',
        new Date(p.created_at).toLocaleString('pt-BR')
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranking_${instance.instance_code}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: `Ranking com ${data.length} performances exportado!` });
    } catch (error) {
      console.error('Error exporting ranking:', error);
      toast({ title: 'Erro ao exportar ranking', variant: 'destructive' });
    } finally {
      setLoadingRanking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Exportar dados">
          <Download className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription>
            Exporte os dados da instância <strong>{instance.name}</strong> ({instance.instance_code})
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={downloadParticipants}
            disabled={loadingParticipants}
            className="justify-start"
            variant="outline"
          >
            {loadingParticipants ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Baixar Participantes (CSV)
            <span className="text-xs text-muted-foreground ml-auto">Nome, Telefone, Email</span>
          </Button>

          <Button
            onClick={downloadRanking}
            disabled={loadingRanking}
            className="justify-start"
            variant="outline"
          >
            {loadingRanking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trophy className="h-4 w-4 mr-2" />
            )}
            Baixar Ranking (CSV)
            <span className="text-xs text-muted-foreground ml-auto">Posição, Cantor, Nota</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
