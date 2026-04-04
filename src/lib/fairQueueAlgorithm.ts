/**
 * =============================================================
 * PRO ADAPTIVE FAIR QUEUE ALGORITHM - Mamute Karaokê
 * =============================================================
 *
 * Prioridade dinâmica com cooldown adaptativo baseado no número
 * de cantores ativos (N). Nunca trava a fila quando poucos cantores.
 *
 * --- REGRAS DE PONTUAÇÃO ---
 * scoreFinal = bonusFewSongs + bonusNewSinger + timeScore - repetitionPenalty
 *
 *  bonusFewSongs   = max(0, (3 - songsSung) * 60)
 *  bonusNewSinger  = songsSung === 0 ? 80 : 0
 *  timeScore       = minutesSinceLastSung * 2
 *  repetitionPenalty (veja abaixo)
 *
 * --- COOLDOWN ADAPTATIVO ---
 * N = nº de cantores distintos com pelo menos 1 música na fila
 * cooldown_target = 2
 * cooldown = min(cooldown_target, N - 1)
 * Se N <= 1 → cooldown = 0
 *
 * --- ANTI-REPETIÇÃO (sem travar) ---
 * lastSingerId = cantor que acabou de cantar / está cantando
 *
 *  • N >= 3  (2+ outros esperando): bloqueio duro → -99999 para lastSinger
 *  • N == 2  (1 outro esperando): penalidade leve → -9999 (outro canta antes, mas não impede)
 *  • N <= 1  (só ele): sem penalidade (libera normalmente)
 *
 * --- DESEMPATE ---
 * 1) Maior scoreFinal
 * 2) lastSungAt mais antigo (quem espera há mais tempo)
 * 3) createdAt mais antigo (ordem de inscrição)
 *
 * --- MÚLTIPLAS MÚSICAS POR CANTOR ---
 * Cada música extra (2ª, 3ª…) de um cantor é pontuada individualmente
 * como se ele já tivesse cantado K vezes a mais (onde K = posição na sua
 * própria sub-fila, 0-indexado). Assim todas as músicas competem na mesma
 * fila justa — músicas extras não "roubam" a vez de quem esperou mais
 * ou cantou menos.
 */

export interface SingerStats {
  /** Quantas músicas o cantor já cantou neste evento */
  songsSung: number;
  /** Timestamp da última vez que o cantor cantou (null = nunca cantou) */
  lastSungAt: Date | null;
}

export interface QueueItem {
  id: string;
  singer_name: string;
  song_title: string;
  youtube_url: string;
  times_sung: number;
  status: string;
  created_at: string;
  priority: number;
  registered_by?: string;
  allow_voting?: boolean;
}

export interface ScoredQueueItem extends QueueItem {
  /** Pontuação final calculada pelo algoritmo */
  _score: number;
  /** Estatísticas do cantor usadas no cálculo */
  _stats: SingerStats;
}

// --------------- helpers ---------------

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function minutesSince(date: Date | null): number {
  if (!date) return 999; // nunca cantou → bônus alto de tempo
  return Math.max(0, (Date.now() - date.getTime()) / 60_000);
}

// --------------- scoring ---------------

/**
 * Calcula a pontuação de prioridade para uma música na fila.
 *
 * @param stats  – histórico do cantor neste evento
 * @param lastSingerId – nome normalizado do último cantor que cantou (ou está cantando)
 * @param singerKey – nome normalizado deste cantor
 * @param activeSingerCount – N (cantores distintos com músicas na fila)
 */
export function calculateScore(
  stats: SingerStats,
  lastSingerId: string | null,
  singerKey: string,
  activeSingerCount: number,
): number {
  const { songsSung, lastSungAt } = stats;

  // --- Bônus por poucas músicas cantadas (principal fator) ---
  // Quanto menos cantou, maior a prioridade
  const bonusFewSongs = Math.max(0, (3 - songsSung) * 60);

  // --- Bônus para cantor novo (nunca cantou no evento) ---
  const bonusNewSinger = songsSung === 0 ? 80 : 0;

  // --- Bônus por tempo de espera ---
  // 2 pontos por minuto desde a última vez que cantou
  const timeScore = minutesSince(lastSungAt) * 2;

  let score = bonusFewSongs + bonusNewSinger + timeScore;

  // --- Penalidade de repetição adaptativa ---
  if (lastSingerId && singerKey === lastSingerId) {
    const N = activeSingerCount;

    if (N >= 3) {
      // 2+ outros esperando → bloqueio duro
      score -= 99999;
    } else if (N === 2) {
      // 1 outro esperando → penalidade forte mas não absoluta
      score -= 9999;
    }
    // N <= 1 → sem penalidade (libera normalmente)
  }

  return score;
}

// --------------- main sorter ---------------

/**
 * Ordena a fila de espera usando o algoritmo PRO adaptativo.
 *
 * Entradas com priority < 0 são overrides do coordenador e são
 * mantidas no topo, inalteradas.
 *
 * @param waitingEntries – todas as entradas com status 'waiting'
 * @param singerHistories – mapa singerKey → SingerStats
 * @param lastSingerId – nome normalizado do último cantor que cantou
 * @returns lista ordenada por prioridade
 */
export function buildProFairOrder(
  waitingEntries: QueueItem[],
  singerHistories: Map<string, SingerStats>,
  lastSingerId: string | null,
): QueueItem[] {
  // 1) Separar overrides do coordenador (priority negativo)
  const coordinatorOverrides = waitingEntries.filter(e => e.priority < 0);
  const regularEntries = waitingEntries.filter(e => e.priority >= 0);

  // Ordenar overrides: prioridade mais negativa primeiro
  coordinatorOverrides.sort((a, b) => a.priority - b.priority);

  if (regularEntries.length === 0) {
    return coordinatorOverrides;
  }

  // 2) Contar cantores ativos (N) = cantores distintos na fila regular
  const activeSingers = new Set(regularEntries.map(e => normalizeName(e.singer_name)));
  const N = activeSingers.size;

  // 3) Agrupar músicas por cantor, ordenadas por createdAt (mais antiga = 1ª da fila)
  const bySinger = new Map<string, QueueItem[]>();
  for (const entry of regularEntries) {
    const key = normalizeName(entry.singer_name);
    if (!bySinger.has(key)) bySinger.set(key, []);
    bySinger.get(key)!.push(entry);
  }
  for (const songs of bySinger.values()) {
    songs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // 4) Calcular score individual para cada música.
  //
  // Para a K-ésima música de um cantor (K=0 = primeira), simula como se ele
  // já tivesse cantado K vezes a mais. Isso faz músicas extras competirem
  // justamente com todos — sem "roubar" a vez de quem esperou mais ou cantou menos.
  //
  // effectiveSongsSung = real + K
  // effectiveLastSungAt = K > 0 ? agora (sem tempo de espera acumulado) : real
  const now = new Date();

  type ScoredEntry = { entry: QueueItem; score: number; createdAt: number; effectiveLastSungAt: Date | null };
  const scoredEntries: ScoredEntry[] = [];

  for (const [singerKey, songs] of bySinger) {
    const stats = singerHistories.get(singerKey) ?? { songsSung: 0, lastSungAt: null };

    songs.forEach((entry, queueIndex) => {
      const effectiveStats: SingerStats = {
        songsSung: stats.songsSung + queueIndex,
        lastSungAt: queueIndex > 0 ? now : stats.lastSungAt,
      };
      const score = calculateScore(effectiveStats, lastSingerId, singerKey, N);
      scoredEntries.push({
        entry,
        score,
        createdAt: new Date(entry.created_at).getTime(),
        effectiveLastSungAt: effectiveStats.lastSungAt,
      });
    });
  }

  // 5) Ordenar todas as músicas por score individual:
  //    a) Maior score primeiro
  //    b) Desempate: lastSungAt mais antigo (quem esperou mais vai antes)
  //    c) Desempate final: inscrição mais antiga
  scoredEntries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aMinutes = minutesSince(a.effectiveLastSungAt);
    const bMinutes = minutesSince(b.effectiveLastSungAt);
    if (bMinutes !== aMinutes) return bMinutes - aMinutes;

    return a.createdAt - b.createdAt;
  });

  const result = scoredEntries.map(s => s.entry);

  // 6) Combinar: overrides do coordenador + fila justa
  return [...coordinatorOverrides, ...result];
}

// --------------- display helpers ---------------

/**
 * Calcula informações de exibição para um item da fila.
 */
export function getQueueItemDisplayInfo(
  entry: QueueItem,
  singerHistories: Map<string, SingerStats>,
  sessionStartedAt?: Date | null,
) {
  const singerKey = normalizeName(entry.singer_name);
  const stats = singerHistories.get(singerKey);
  const songsSung = stats?.songsSung ?? 0;
  const isNewSinger = songsSung === 0;

  // Tempo de espera na fila: usa o mais recente entre created_at e session_started_at
  // Isso evita que entradas de sessões anteriores mostrem tempo acumulado
  const entryTime = new Date(entry.created_at).getTime();
  const sessionTime = sessionStartedAt ? sessionStartedAt.getTime() : 0;
  const effectiveStart = Math.max(entryTime, sessionTime);
  const waitMinutes = Math.floor(
    (Date.now() - effectiveStart) / 60_000
  );

  return {
    songsSung,
    isNewSinger,
    waitMinutes: Math.max(0, waitMinutes),
    isCoordinatorOverride: entry.priority < 0,
  };
}
