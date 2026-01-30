import { useState, useEffect } from 'react';
import { Download, Loader2, FileText, Users, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EventArchive {
  id: string;
  instance_name: string;
  instance_code: string;
  event_date: string;
  rankings: Array<{
    cantor: string;
    musica: string;
    nota_media: number;
    total_votos: number;
  }>;
  karaoke_instance_id: string;
}

interface KaraokeInstance {
  id: string;
  name: string;
  instance_code: string;
}

export function AdminEventArchives() {
  const { toast } = useToast();
  const [archives, setArchives] = useState<EventArchive[]>([]);
  const [instances, setInstances] = useState<KaraokeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const [loadingDownload, setLoadingDownload] = useState<string | null>(null);
  const [loadingCompiled, setLoadingCompiled] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch instances
      const { data: instancesData } = await supabase
        .from('karaoke_instances')
        .select('id, name, instance_code')
        .order('name');

      setInstances(instancesData || []);

      // Fetch event archives
      const { data: archivesData, error } = await supabase
        .from('event_archives')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      
      // Parse rankings JSON properly
      const parsed = (archivesData || []).map(archive => ({
        ...archive,
        rankings: (archive.rankings as unknown as EventArchive['rankings']) || [],
      }));
      setArchives(parsed);
    } catch (error) {
      console.error('Error fetching archives:', error);
      toast({ title: 'Erro ao carregar arquivos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredArchives = selectedInstance === 'all' 
    ? archives 
    : archives.filter(a => a.karaoke_instance_id === selectedInstance);

  const downloadArchive = (archive: EventArchive) => {
    setLoadingDownload(archive.id);
    try {
      const rankings = archive.rankings || [];
      const headers = ['Posição', 'Cantor', 'Música', 'Nota Média', 'Total Votos'];
      const rows = rankings.map((r, idx) => [
        (idx + 1).toString(),
        r.cantor,
        r.musica,
        r.nota_media?.toString() || '0',
        r.total_votos?.toString() || '0',
      ]);

      const csvContent = [
        `Evento: ${archive.instance_name} (${archive.instance_code})`,
        `Data: ${new Date(archive.event_date).toLocaleString('pt-BR')}`,
        '',
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date(archive.event_date).toISOString().split('T')[0];
      link.download = `ranking_${archive.instance_code}_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Arquivo baixado!' });
    } finally {
      setLoadingDownload(null);
    }
  };

  const downloadCompiledParticipants = async () => {
    setLoadingCompiled(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          name,
          phone,
          email,
          created_at,
          karaoke_instance_id,
          karaoke_instances!participants_karaoke_instance_id_fkey (
            name,
            instance_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'Nenhum participante cadastrado', variant: 'destructive' });
        return;
      }

      const headers = ['Nome', 'Telefone', 'Email', 'Data Cadastro', 'ID Instância', 'Nome Instância', 'Código Instância'];
      const rows = data.map(p => [
        p.name,
        p.phone,
        p.email,
        new Date(p.created_at).toLocaleString('pt-BR'),
        p.karaoke_instance_id,
        p.karaoke_instances?.name || 'N/A',
        p.karaoke_instances?.instance_code || 'N/A',
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `participantes_compilado_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: `${data.length} participantes exportados!` });
    } catch (error) {
      console.error('Error exporting participants:', error);
      toast({ title: 'Erro ao exportar', variant: 'destructive' });
    } finally {
      setLoadingCompiled(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Arquivos de Eventos
        </CardTitle>
        <CardDescription>
          Rankings de eventos encerrados e base de participantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compiled participants download */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Base Compilada de Participantes</p>
                <p className="text-sm text-muted-foreground">
                  Todos os usuários cadastrados em todas as instâncias
                </p>
              </div>
            </div>
            <Button onClick={downloadCompiledParticipants} disabled={loadingCompiled}>
              {loadingCompiled ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar CSV
            </Button>
          </div>
        </div>

        {/* Filter by instance */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por instância:</span>
          </div>
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as instâncias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as instâncias</SelectItem>
              {instances.map(inst => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name} ({inst.instance_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Archives list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum arquivo de evento encontrado</p>
            <p className="text-sm">Os rankings são salvos quando eventos são encerrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredArchives.map(archive => (
              <div 
                key={archive.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {archive.instance_name} 
                      <span className="text-muted-foreground text-sm ml-2">
                        ({archive.instance_code})
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(archive.event_date).toLocaleString('pt-BR')} • {archive.rankings?.length || 0} performances
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadArchive(archive)}
                  disabled={loadingDownload === archive.id}
                >
                  {loadingDownload === archive.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
