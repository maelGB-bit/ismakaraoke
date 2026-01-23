import { useState } from 'react';
import { Search, Loader2, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

interface YouTubeSearchProps {
  onSelectVideo: (url: string, title?: string) => void;
  disabled?: boolean;
}

export function YouTubeSearch({ onSelectVideo, disabled }: YouTubeSearchProps) {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Bitte etwas eingeben',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setVideos([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: query.trim() },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setVideos(data.videos || []);

      if (data.videos?.length === 0) {
        toast({
          title: 'Kein Video gefunden',
          description: 'Versuche es mit anderen Suchbegriffen',
        });
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast({
        title: 'Suchfehler',
        description: 'Videos konnten nicht gesucht werden. Überprüfe die API-Konfiguration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Lied auf YouTube suchen..."
            className="pl-10"
            disabled={disabled || isLoading}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={disabled || isLoading}
          variant="secondary"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Suchen'
          )}
        </Button>
      </div>

      {videos.length > 0 && (
        <ScrollArea className="h-[280px] rounded-lg border border-border bg-background/50">
          <div className="p-2 space-y-2">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => onSelectVideo(video.url, video.title)}
                disabled={disabled}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group disabled:opacity-50"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-28 h-16 object-cover rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2 text-foreground">
                    {decodeHtmlEntities(video.title)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {video.channelTitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
