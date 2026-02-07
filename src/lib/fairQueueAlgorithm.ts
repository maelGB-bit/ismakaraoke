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
 * --- ROUND-ROBIN POR CANTOR ---
 * Se um cantor tem várias músicas, apenas a primeira (por createdAt)
 * participa da ordenação; as demais são intercaladas depois.
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

  // 3) Agrupar músicas por cantor
  const bySinger = new Map<string, QueueItem[]>();
  for (const entry of regularEntries) {
    const key = normalizeName(entry.singer_name);
    if (!bySinger.has(key)) bySinger.set(key, []);
    bySinger.get(key)!.push(entry);
  }

  // Ordenar músicas de cada cantor por createdAt (mais antiga primeiro)
  for (const songs of bySinger.values()) {
    songs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // 4) Calcular score para cada cantor (usando sua primeira música)
  const singerScores: { key: string; score: number; firstCreatedAt: number; stats: SingerStats }[] = [];

  for (const [singerKey, songs] of bySinger) {
    const stats = singerHistories.get(singerKey) ?? { songsSung: 0, lastSungAt: null };
    const score = calculateScore(stats, lastSingerId, singerKey, N);
    singerScores.push({
      key: singerKey,
      score,
      firstCreatedAt: new Date(songs[0].created_at).getTime(),
      stats,
    });
  }

  // 5) Ordenar cantores por:
  //    a) Maior score
  //    b) Desempate: lastSungAt mais antigo (ou nunca cantou = prioridade máxima)
  //    c) Desempate: createdAt mais antigo
  singerScores.sort((a, b) => {
    // Maior score primeiro
    if (b.score !== a.score) return b.score - a.score;

    // Desempate: quem cantou há mais tempo (ou nunca) vai primeiro
    const aMinutes = minutesSince(a.stats.lastSungAt);
    const bMinutes = minutesSince(b.stats.lastSungAt);
    if (bMinutes !== aMinutes) return bMinutes - aMinutes;

    // Desempate final: inscrição mais antiga
    return a.firstCreatedAt - b.firstCreatedAt;
  });

  // 6) Round-robin: intercalar músicas de cada cantor
  const orderedSingerKeys = singerScores.map(s => s.key);
  const result: QueueItem[] = [];

  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const key of orderedSingerKeys) {
      const songs = bySinger.get(key);
      if (songs && songs.length > 0) {
        result.push(songs.shift()!);
        hasMore = true;
      }
    }
  }

  // 7) Combinar: overrides do coordenador + fila justa
  return [...coordinatorOverrides, ...result];
}

// --------------- display helpers ---------------

/**
 * Calcula informações de exibição para um item da fila.
 */
export function getQueueItemDisplayInfo(
  entry: QueueItem,
  singerHistories: Map<string, SingerStats>,
) {
  const singerKey = normalizeName(entry.singer_name);
  const stats = singerHistories.get(singerKey);
  const songsSung = stats?.songsSung ?? 0;
  const isNewSinger = songsSung === 0;

  // Tempo de espera na fila (desde que entrou)
  const waitMinutes = Math.floor(
    (Date.now() - new Date(entry.created_at).getTime()) / 60_000
  );

  return {
    songsSung,
    isNewSinger,
    waitMinutes,
    isCoordinatorOverride: entry.priority < 0,
  };
}
