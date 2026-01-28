import { useSiteVideo } from '@/hooks/useSiteVideos';
import { Loader2, Play } from 'lucide-react';

interface SiteYouTubePlayerProps {
  videoKey: string;
  className?: string;
  placeholderText?: string;
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

export function SiteYouTubePlayer({ videoKey, className = '', placeholderText }: SiteYouTubePlayerProps) {
  const { data: video, isLoading } = useSiteVideo(videoKey);

  if (isLoading) {
    return (
      <div className={`aspect-video bg-black/40 rounded-2xl flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  const videoId = video?.youtube_url ? extractVideoId(video.youtube_url) : null;

  if (!videoId) {
    return (
      <div className={`aspect-video bg-black/40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40" />
        <div className="relative z-10 text-center px-6">
          <Play className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 text-sm">
            {placeholderText || 'Vídeo não configurado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={video?.title || 'YouTube video'}
      />
    </div>
  );
}
