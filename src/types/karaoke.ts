export interface Performance {
  id: string;
  cantor: string;
  musica: string;
  youtube_url: string | null;
  status: 'ativa' | 'encerrada';
  nota_media: number;
  total_votos: number;
  created_at: string;
  video_changed_at?: string | null;
}

export interface Vote {
  id: string;
  performance_id: string;
  nota: number;
  device_id: string;
  created_at: string;
}
