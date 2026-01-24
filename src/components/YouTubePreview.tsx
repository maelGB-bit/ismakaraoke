import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';

interface YouTubePreviewProps {
  videoId: string;
  maxDuration?: number; // in seconds, default 30
  onEnd?: () => void;
}

export function YouTubePreview({ videoId, maxDuration = 30, onEnd }: YouTubePreviewProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [player, setPlayer] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef(`youtube-preview-${Date.now()}`);

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        createPlayer();
        return;
      }

      // Check if script is already being loaded
      if (document.getElementById('youtube-iframe-api')) {
        (window as any).onYouTubeIframeAPIReady = createPlayer;
        return;
      }

      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = createPlayer;
    };

    const createPlayer = () => {
      if (player) return;
      
      const newPlayer = new (window as any).YT.Player(playerIdRef.current, {
        height: '180',
        width: '320',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              handleStop();
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          // Player might already be destroyed
        }
      }
    };
  }, [videoId]);

  // Track current time and enforce max duration
  useEffect(() => {
    if (isPlaying && player) {
      intervalRef.current = setInterval(() => {
        try {
          const time = player.getCurrentTime?.() || 0;
          setCurrentTime(time);
          
          if (time >= maxDuration) {
            handleStop();
            onEnd?.();
          }
        } catch (e) {
          // Player might not be ready
        }
      }, 500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, player, maxDuration, onEnd]);

  const handlePlay = () => {
    if (player) {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (player) {
      player.pauseVideo();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (player) {
      player.pauseVideo();
      player.seekTo(0, true);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const progress = (currentTime / maxDuration) * 100;
  const remainingTime = Math.max(0, maxDuration - Math.floor(currentTime));

  return (
    <div className="space-y-3">
      {/* Video Player */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <div id={playerIdRef.current} className="w-full h-full" />
        
        {/* Overlay when not playing */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-10 h-10 p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className="w-10 h-10 p-0"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 space-y-1">
          <Progress value={progress} className="h-2" />
        </div>

        <span className="text-xs text-muted-foreground min-w-[40px] text-right">
          {remainingTime}s
        </span>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t('signup.previewHint')}
      </p>
    </div>
  );
}
