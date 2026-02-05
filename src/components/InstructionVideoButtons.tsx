import { Film, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstructionVideos, InstructionVideo } from '@/hooks/useInstructionVideos';

interface InstructionVideoButtonsProps {
  onPlayVideo: (video: InstructionVideo) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPlayingId?: string | null;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function InstructionVideoButtons({
  onPlayVideo,
  disabled = false,
  isLoading = false,
  currentPlayingId = null,
  size = 'sm',
  variant = 'outline',
  className = '',
}: InstructionVideoButtonsProps) {
  const { data: videos, isLoading: videosLoading } = useInstructionVideos();
  
  // Filter only active videos
  const activeVideos = videos?.filter(v => v.is_active) || [];
  
  if (videosLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (activeVideos.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {activeVideos.map((video) => {
        const isPlaying = currentPlayingId === video.id;
        
        return (
          <Button
            key={video.id}
            onClick={() => onPlayVideo(video)}
            disabled={disabled || isLoading || isPlaying}
            size={size}
            variant={isPlaying ? 'default' : variant}
            className={`gap-1 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
          >
            {isPlaying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Film className="h-3 w-3" />
            )}
            <span className="text-xs">{video.button_name}</span>
          </Button>
        );
      })}
    </div>
  );
}
