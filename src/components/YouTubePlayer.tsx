import { useMemo } from 'react';

interface YouTubePlayerProps {
  url: string | null;
}

function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubePlayer({ url }: YouTubePlayerProps) {
  const videoId = useMemo(() => (url ? extractVideoId(url) : null), [url]);

  if (!videoId) {
    return (
      <div className="aspect-video w-full bg-muted/50 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhum vídeo carregado</p>
          <p className="text-sm">Cole a URL do YouTube acima</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden neon-border-cyan border-2">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
      />
    </div>
  );
}
