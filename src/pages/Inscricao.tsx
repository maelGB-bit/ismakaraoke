import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Search, Loader2, Play, ArrowLeft, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWaitlist } from '@/hooks/useWaitlist';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

export default function Inscricao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToWaitlist } = useWaitlist();
  
  const [singerName, setSingerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Digite o nome da música',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setVideos([]);
    setSelectedVideo(null);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery.trim() },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setVideos(data.videos || []);

      if (data.videos?.length === 0) {
        toast({
          title: 'Nenhum vídeo encontrado',
          description: 'Tente buscar com outros termos',
        });
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar vídeos',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
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

  const handleSelectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
  };

  const handleSubmit = async () => {
    if (!singerName.trim()) {
      toast({
        title: 'Digite seu nome',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVideo) {
      toast({
        title: 'Selecione uma música',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const success = await addToWaitlist(
      singerName.trim(),
      selectedVideo.url,
      decodeHtmlEntities(selectedVideo.title)
    );

    setIsSubmitting(false);

    if (success) {
      // Reset form
      setSingerName('');
      setSearchQuery('');
      setVideos([]);
      setSelectedVideo(null);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-gradient">
              Inscrição
            </h1>
          </div>
          <p className="text-muted-foreground">
            Escolha sua música e entre na fila!
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-6 space-y-6">
          {/* Singer Name */}
          <div className="space-y-2">
            <Label htmlFor="singer-name" className="text-lg flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Seu Nome
            </Label>
            <Input
              id="singer-name"
              value={singerName}
              onChange={(e) => setSingerName(e.target.value)}
              placeholder="Digite seu nome..."
              className="text-lg"
            />
          </div>

          {/* Song Search */}
          <div className="space-y-2">
            <Label className="text-lg flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar Música
            </Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite o nome da música..."
                className="flex-1"
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                variant="secondary"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
          </div>

          {/* Selected Video */}
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary/30"
            >
              <p className="text-sm text-muted-foreground mb-1">Música selecionada:</p>
              <div className="flex items-center gap-3">
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <p className="font-medium text-sm line-clamp-2 flex-1">
                  {decodeHtmlEntities(selectedVideo.title)}
                </p>
              </div>
            </motion.div>
          )}

          {/* Video Results */}
          {videos.length > 0 && (
            <ScrollArea className="h-[250px] rounded-lg border border-border bg-background/50">
              <div className="p-2 space-y-2">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group ${
                      selectedVideo?.id === video.id
                        ? 'bg-primary/20 border border-primary/50'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <Play className="h-5 w-5 text-white fill-white" />
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

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !singerName.trim() || !selectedVideo}
            size="lg"
            className="w-full text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Mic className="mr-2 h-5 w-5" />
            )}
            Quero Cantar!
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/vote')}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir para Votação
          </Button>
          <Button
            onClick={() => navigate('/ranking')}
            variant="outline"
            className="flex-1"
          >
            Ver Ranking
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
