import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, Mic2, Users, Key, Trophy, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  type: 'performance' | 'waitlist' | 'coordinator' | 'api_key' | 'archive';
  label: string;
  detail: string;
  timestamp: string;
  instanceName?: string;
}

const TYPE_META: Record<LogEntry['type'], { icon: React.ReactNode; color: string; badge: string }> = {
  performance: {
    icon: <Mic2 className="h-4 w-4" />,
    color: 'text-primary',
    badge: 'Apresentação',
  },
  waitlist: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-secondary',
    badge: 'Fila',
  },
  coordinator: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-accent',
    badge: 'Coordenador',
  },
  api_key: {
    icon: <Key className="h-4 w-4" />,
    color: 'text-yellow-500',
    badge: 'API Key',
  },
  archive: {
    icon: <Trophy className="h-4 w-4" />,
    color: 'text-neon-green',
    badge: 'Arquivo',
  },
};

export function AdminActivityLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<LogEntry['type'] | 'all'>('all');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // últimos 7 dias

      const [perfRes, waitlistRes, coordRes, archiveRes] = await Promise.all([
        // Últimas apresentações (encerradas e ativas)
        supabase
          .from('performances')
          .select('id, cantor, musica, status, created_at, karaoke_instance_id')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(40),

        // Últimas inscrições na fila
        supabase
          .from('waitlist')
          .select('id, singer_name, song_title, status, created_at, karaoke_instance_id')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(40),

        // Solicitações de coordenadores (aprovações, reprovações)
        supabase
          .from('coordinator_requests')
          .select('id, name, email, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(20),

        // Arquivos de eventos salvos
        supabase
          .from('event_archives')
          .select('id, instance_name, instance_code, event_date')
          .order('event_date', { ascending: false })
          .limit(20),
      ]);

      const logs: LogEntry[] = [];

      // Performances
      for (const p of perfRes.data || []) {
        logs.push({
          id: `perf-${p.id}`,
          type: 'performance',
          label: `${p.cantor} — ${p.musica}`,
          detail: p.status === 'encerrada' ? 'Encerrada' : 'Ativa',
          timestamp: p.created_at,
          instanceName: p.karaoke_instance_id || undefined,
        });
      }

      // Waitlist
      for (const w of waitlistRes.data || []) {
        logs.push({
          id: `wait-${w.id}`,
          type: 'waitlist',
          label: `${w.singer_name} inscreveu "${w.song_title}"`,
          detail: w.status,
          timestamp: w.created_at,
          instanceName: w.karaoke_instance_id || undefined,
        });
      }

      // Coordinators
      for (const c of coordRes.data || []) {
        logs.push({
          id: `coord-${c.id}`,
          type: 'coordinator',
          label: `${c.name} (${c.email})`,
          detail: c.status === 'approved' ? 'Aprovado' : c.status === 'rejected' ? 'Rejeitado' : 'Pendente',
          timestamp: c.updated_at || c.created_at,
        });
      }

      // Archives
      for (const a of archiveRes.data || []) {
        logs.push({
          id: `arch-${a.id}`,
          type: 'archive',
          label: `Evento arquivado: ${a.instance_name}`,
          detail: a.instance_code,
          timestamp: a.event_date,
        });
      }

      // Sort all by timestamp desc
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(logs);
    } catch (err) {
      console.error('Error fetching activity log:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filtered = filterType === 'all' ? entries : entries.filter(e => e.type === filterType);

  const typeCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Log de Atividades</h2>
          <span className="text-sm text-muted-foreground">(últimos 7 dias)</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActivity} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'performance', 'waitlist', 'coordinator', 'archive'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterType === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            {type === 'all' ? `Todos (${entries.length})` : `${TYPE_META[type].badge} (${typeCounts[type] || 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando atividades...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <TriangleAlert className="h-8 w-8 mb-2 opacity-40" />
          <p>Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px] rounded-lg border border-border">
          <div className="divide-y divide-border">
            {filtered.map(entry => {
              const meta = TYPE_META[entry.type];
              const date = new Date(entry.timestamp);
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 hover:bg-accent/30 transition-colors">
                  <div className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {meta.badge}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{entry.detail}</span>
                      {entry.instanceName && (
                        <span className="text-xs text-muted-foreground opacity-60 truncate max-w-[120px]">
                          inst: {entry.instanceName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{date.toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
