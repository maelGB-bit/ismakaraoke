import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Mic2, Trophy, Clock, Users, Music, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface EventStatsProps {
  instanceId: string | null;
  instanceName?: string;
}

interface StatsData {
  totalSongsSung: number;
  avgScore: number;
  topScore: number;
  topScoreSinger: string;
  topScoreSong: string;
  distinctSingers: number;
  mostActiveSinger: { name: string; count: number } | null;
  waitingCount: number;
  singerDistribution: { name: string; count: number }[];
  peakHour: { hour: string; count: number } | null;
}

export function EventStatsPanel({ instanceId, instanceName }: EventStatsProps) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);

    try {
      // Buscar session_started_at para delimitar a sessão atual
      const { data: settingsData } = await supabase
        .from('event_settings')
        .select('session_started_at')
        .eq('karaoke_instance_id', instanceId)
        .maybeSingle();

      const sessionStart = settingsData?.session_started_at || null;

      // Performances encerradas desta sessão
      let perfQuery = supabase
        .from('performances')
        .select('cantor, musica, nota_media, created_at')
        .eq('karaoke_instance_id', instanceId)
        .eq('status', 'encerrada');

      if (sessionStart) {
        perfQuery = perfQuery.gte('created_at', sessionStart);
      }

      const { data: performances } = await perfQuery;

      // Fila de espera atual
      const { data: waitlistData } = await supabase
        .from('waitlist')
        .select('id')
        .eq('karaoke_instance_id', instanceId)
        .eq('status', 'waiting');

      const perf = performances || [];

      // Calcular estatísticas
      const totalSongsSung = perf.length;
      const avgScore =
        totalSongsSung > 0
          ? perf.reduce((sum, p) => sum + Number(p.nota_media || 0), 0) / totalSongsSung
          : 0;

      const topEntry = perf.reduce<{ nota: number; cantor: string; musica: string } | null>(
        (best, p) => {
          const nota = Number(p.nota_media || 0);
          return !best || nota > best.nota ? { nota, cantor: p.cantor, musica: p.musica } : best;
        },
        null,
      );

      // Cantores distintos
      const singerMap = new Map<string, number>();
      for (const p of perf) {
        const key = p.cantor.trim().toLowerCase();
        singerMap.set(key, (singerMap.get(key) || 0) + 1);
      }

      const singerDistribution = Array.from(singerMap.entries())
        .map(([name, count]) => ({ name: perf.find(p => p.cantor.toLowerCase() === name)?.cantor || name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const mostActiveSinger = singerDistribution.length > 0 ? singerDistribution[0] : null;

      // Horário de pico (agrupa por hora)
      const hourMap = new Map<string, number>();
      for (const p of perf) {
        const d = new Date(p.created_at);
        const hour = `${String(d.getHours()).padStart(2, '0')}:00`;
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }

      let peakHour: { hour: string; count: number } | null = null;
      for (const [hour, count] of hourMap.entries()) {
        if (!peakHour || count > peakHour.count) {
          peakHour = { hour, count };
        }
      }

      setStats({
        totalSongsSung,
        avgScore,
        topScore: topEntry?.nota || 0,
        topScoreSinger: topEntry?.cantor || '',
        topScoreSong: topEntry?.musica || '',
        distinctSingers: singerMap.size,
        mostActiveSinger,
        waitingCount: waitlistData?.length || 0,
        singerDistribution,
        peakHour,
      });
    } catch (err) {
      console.error('Error fetching event stats:', err);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open, fetchStats]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent"
      >
        <BarChart3 className="h-4 w-4" />
        Estatísticas do evento
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estatísticas — {instanceName || 'Evento'}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="h-6 w-6 animate-pulse mr-2" />
              Calculando...
            </div>
          ) : !stats ? (
            <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
          ) : (
            <div className="space-y-5">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Music className="h-5 w-5 text-primary" />} label="Músicas cantadas" value={stats.totalSongsSung.toString()} />
                <StatCard icon={<Users className="h-5 w-5 text-secondary" />} label="Cantores distintos" value={stats.distinctSingers.toString()} />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5 text-neon-green" />}
                  label="Nota média geral"
                  value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}
                />
                <StatCard icon={<Mic2 className="h-5 w-5 text-accent" />} label="Na fila agora" value={stats.waitingCount.toString()} />
              </div>

              {/* Destaque: Melhor nota */}
              {stats.topScore > 0 && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">Melhor apresentação</span>
                  </div>
                  <p className="text-base font-bold">{stats.topScoreSinger}</p>
                  <p className="text-sm text-muted-foreground truncate">{stats.topScoreSong}</p>
                  <p className="text-2xl font-black text-yellow-500 mt-1">{stats.topScore.toFixed(1)}</p>
                </div>
              )}

              {/* Horário de pico */}
              {stats.peakHour && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Horário de maior atividade</p>
                    <p className="font-semibold">{stats.peakHour.hour} — {stats.peakHour.count} apresent.</p>
                  </div>
                </div>
              )}

              {/* Ranking de cantores */}
              {stats.singerDistribution.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Mic2 className="h-4 w-4 text-primary" /> Músicas por cantor
                  </p>
                  <div className="space-y-1.5">
                    {stats.singerDistribution.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm truncate flex-1">{s.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <div
                              className="h-2 rounded-full bg-primary/60"
                              style={{
                                width: `${Math.round((s.count / (stats.mostActiveSinger?.count || 1)) * 80)}px`,
                                minWidth: '8px',
                              }}
                            />
                            <span className="text-xs font-mono w-4">{s.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={fetchStats}>
                  Atualizar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 mr-1" /> Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}
