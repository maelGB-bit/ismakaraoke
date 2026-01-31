import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Users, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RankingEntry {
  id: string;
  cantor: string;
  musica: string;
  nota_media: number;
  total_votos: number;
  global_score: number;
  instance_name: string | null;
  instance_code: string | null;
}

export function MonthlyRanking() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Query the monthly_ranking view which is accessible to everyone
        const { data, error } = await supabase
          .from('monthly_ranking')
          .select('*')
          .order('global_score', { ascending: false })
          .limit(30);

        if (error) {
          console.error('Error fetching from view:', error);
          // Fallback: query performances directly
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const endOfMonth = new Date(startOfMonth);
          endOfMonth.setMonth(endOfMonth.getMonth() + 1);

          const { data: perfData, error: perfError } = await supabase
            .from('performances')
            .select(`
              id,
              cantor,
              musica,
              nota_media,
              total_votos,
              created_at,
              karaoke_instance_id,
              karaoke_instances!performances_karaoke_instance_id_fkey (
                name,
                instance_code
              )
            `)
            .eq('status', 'encerrada')
            .gte('created_at', startOfMonth.toISOString())
            .lt('created_at', endOfMonth.toISOString())
            .gt('total_votos', 0)
            .order('nota_media', { ascending: false })
            .limit(100);

          if (!perfError && perfData) {
            const ranked = perfData
              .map(entry => ({
                id: entry.id,
                cantor: entry.cantor,
                musica: entry.musica,
                nota_media: Number(entry.nota_media) || 0,
                total_votos: entry.total_votos || 0,
                global_score: (Number(entry.nota_media) || 0) * (entry.total_votos || 0),
                instance_name: entry.karaoke_instances?.name || null,
                instance_code: entry.karaoke_instances?.instance_code || null,
              }))
              .sort((a, b) => b.global_score - a.global_score)
              .slice(0, 30);

            setRankings(ranked);
          }
        } else if (data) {
          setRankings(data.map(entry => ({
            id: entry.id || '',
            cantor: entry.cantor || '',
            musica: entry.musica || '',
            nota_media: Number(entry.nota_media) || 0,
            total_votos: entry.total_votos || 0,
            global_score: Number(entry.global_score) || 0,
            instance_name: entry.instance_name || null,
            instance_code: entry.instance_code || null,
          })));
        }
      } catch (error) {
        console.error('Error fetching monthly ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();

    // Set up realtime subscription for when performances are updated
    const channel = supabase
      .channel('monthly-ranking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performances',
        },
        () => {
          // Refetch rankings when performances change
          fetchRankings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <section id="ranking-mensal" className="py-16 bg-landing-dark">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-landing-orange mx-auto" />
        </div>
      </section>
    );
  }

  // Always show the section, even with no data - just display a message
  const hasData = rankings.length > 0;

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <section id="ranking-mensal" className="py-16 bg-gradient-to-b from-landing-dark to-landing-brown/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-landing-orange" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Ranking do Mês
            </h2>
          </div>
          <p className="text-white/60 text-lg capitalize">{currentMonth}</p>
          <p className="text-white/40 text-sm mt-2">
            Top 30 melhores performances baseado na nota global (média × votos)
          </p>
        </motion.div>

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-landing-orange/30 mx-auto mb-4" />
            <p className="text-white/50 text-lg">Nenhuma performance registrada este mês ainda</p>
            <p className="text-white/30 text-sm mt-2">As votações encerradas aparecerão aqui automaticamente</p>
          </motion.div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-landing-brown/30 rounded-t-lg text-white/60 text-sm font-medium">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Cantor</div>
              <div className="col-span-3">Música</div>
              <div className="col-span-1 text-center">Nota</div>
              <div className="col-span-1 text-center">Votos</div>
              <div className="col-span-1 text-center">Global</div>
              <div className="col-span-2">Instância</div>
            </div>

            {/* Rankings */}
            <div className="space-y-1">
              {rankings.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02 }}
                  className={`
                    grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 rounded-lg
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-landing-orange/20 border border-yellow-500/30' : 
                      index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20' :
                      index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-amber-800/10 border border-amber-700/20' :
                      'bg-landing-brown/10 hover:bg-landing-brown/20'}
                    transition-colors
                  `}
                >
                  {/* Position */}
                  <div className="md:col-span-1 flex items-center justify-center md:justify-center gap-2">
                    <span className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-landing-brown/30 text-white/60'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="md:hidden text-white font-bold">{entry.cantor}</span>
                  </div>

                  {/* Singer Name - Desktop */}
                  <div className="hidden md:flex md:col-span-3 items-center gap-2">
                    <Music className="w-4 h-4 text-landing-orange flex-shrink-0" />
                    <span className="text-white font-medium truncate">{entry.cantor}</span>
                  </div>

                  {/* Song */}
                  <div className="md:col-span-3 flex items-center">
                    <span className="text-white/80 truncate text-sm md:text-base pl-10 md:pl-0">
                      {entry.musica}
                    </span>
                  </div>

                  {/* Stats - Mobile */}
                  <div className="md:hidden flex items-center justify-between pl-10 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">{entry.nota_media.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{entry.total_votos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-landing-orange" />
                        <span className="text-landing-orange font-bold">{entry.global_score.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score - Desktop */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <span className={`font-bold ${entry.nota_media >= 9 ? 'text-yellow-400' : 'text-white'}`}>
                      {entry.nota_media.toFixed(1)}
                    </span>
                  </div>

                  {/* Votes - Desktop */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <span className="text-white/80">{entry.total_votos}</span>
                  </div>

                  {/* Global Score - Desktop */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <span className="text-landing-orange font-bold text-lg">
                      {entry.global_score.toFixed(0)}
                    </span>
                  </div>

                  {/* Instance - Desktop */}
                  <div className="hidden md:flex md:col-span-2 items-center">
                    <span className="text-white/50 text-sm truncate">
                      {entry.instance_name || 'N/A'}
                    </span>
                  </div>

                  {/* Instance - Mobile */}
                  {entry.instance_name && (
                    <div className="md:hidden pl-10">
                      <span className="text-white/40 text-xs">{entry.instance_name}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
