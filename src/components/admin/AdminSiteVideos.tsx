import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader2, Save, ExternalLink, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSiteVideos, useUpdateSiteVideo } from '@/hooks/useSiteVideos';
import { useToast } from '@/hooks/use-toast';

export function AdminSiteVideos() {
  const { data: videos, isLoading } = useSiteVideos();
  const updateVideo = useUpdateSiteVideo();
  const { toast } = useToast();
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});

  const handleSave = async (id: string, key: string) => {
    const url = editedUrls[key] ?? '';
    try {
      await updateVideo.mutateAsync({ 
        id, 
        youtube_url: url.trim() || null 
      });
      toast({
        title: 'Vídeo atualizado',
        description: 'O link do vídeo foi salvo com sucesso.',
      });
      setEditedUrls(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const getVideoId = (url: string | null) => {
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-card neon-border-pink">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="neon-text-pink">Vídeos do Site</CardTitle>
              <CardDescription>
                Configure os links dos vídeos do YouTube exibidos nas páginas do site
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {videos?.map((video) => {
            const currentUrl = editedUrls[video.key] ?? video.youtube_url ?? '';
            const hasChanges = editedUrls[video.key] !== undefined && 
              editedUrls[video.key] !== (video.youtube_url ?? '');
            const videoId = getVideoId(currentUrl);

            return (
              <div 
                key={video.id} 
                className="p-4 rounded-lg bg-background/50 border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    )}
                  </div>
                  {videoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`video-${video.key}`} className="sr-only">
                      URL do YouTube
                    </Label>
                    <Input
                      id={`video-${video.key}`}
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={currentUrl}
                      onChange={(e) => setEditedUrls(prev => ({
                        ...prev,
                        [video.key]: e.target.value
                      }))}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(video.id, video.key)}
                    disabled={!hasChanges || updateVideo.isPending}
                    size="icon"
                    variant={hasChanges ? 'default' : 'secondary'}
                  >
                    {updateVideo.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Preview */}
                {videoId && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black/20 border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    />
                  </div>
                )}

                {!videoId && currentUrl && (
                  <p className="text-sm text-destructive">URL inválida do YouTube</p>
                )}

                {!currentUrl && (
                  <div className="aspect-video rounded-lg bg-muted/20 border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum vídeo configurado</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
