import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader2, Plus, Save, Trash2, GripVertical, Play, ExternalLink, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  useInstructionVideos, 
  useInstructionVideoSettings,
  useCreateInstructionVideo,
  useUpdateInstructionVideo,
  useDeleteInstructionVideo,
  useUpdateInstructionVideoSettings,
  InstructionVideo
} from '@/hooks/useInstructionVideos';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AdminInstructionVideos() {
  const { data: videos, isLoading } = useInstructionVideos();
  const { data: settings } = useInstructionVideoSettings();
  const createVideo = useCreateInstructionVideo();
  const updateVideo = useUpdateInstructionVideo();
  const deleteVideo = useDeleteInstructionVideo();
  const updateSettings = useUpdateInstructionVideoSettings();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: '',
    duration_seconds: 0,
  });
  const [insertionFrequency, setInsertionFrequency] = useState(settings?.insertion_frequency ?? 3);

  const getVideoId = (url: string) => {
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

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.youtube_url) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e a URL do vídeo.',
        variant: 'destructive',
      });
      return;
    }

    const videoId = getVideoId(newVideo.youtube_url);
    if (!videoId) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida do YouTube.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createVideo.mutateAsync({
        title: newVideo.title,
        youtube_url: newVideo.youtube_url,
        duration_seconds: newVideo.duration_seconds || null,
        sort_order: (videos?.length ?? 0) + 1,
        is_active: true,
      });
      toast({
        title: 'Vídeo adicionado',
        description: 'O vídeo foi adicionado com sucesso.',
      });
      setNewVideo({ title: '', youtube_url: '', duration_seconds: 0 });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (video: InstructionVideo) => {
    try {
      await updateVideo.mutateAsync({
        id: video.id,
        is_active: !video.is_active,
      });
      toast({
        title: video.is_active ? 'Vídeo desativado' : 'Vídeo ativado',
        description: `O vídeo "${video.title}" foi ${video.is_active ? 'desativado' : 'ativado'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    
    try {
      await deleteVideo.mutateAsync(deleteVideoId);
      toast({
        title: 'Vídeo removido',
        description: 'O vídeo foi removido com sucesso.',
      });
      setDeleteVideoId(null);
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFrequency = async () => {
    try {
      await updateSettings.mutateAsync({ insertion_frequency: insertionFrequency });
      toast({
        title: 'Configuração salva',
        description: `Vídeos serão inseridos a cada ${insertionFrequency} apresentações.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    }
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
      className="space-y-6"
    >
      {/* Settings Card */}
      <Card className="glass-card neon-border-pink">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="neon-text-pink">Configurações de Inserção</CardTitle>
              <CardDescription>
                Configure a frequência de inserção dos vídeos explicativos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="frequency">Inserir vídeo a cada X apresentações</Label>
              <Input
                id="frequency"
                type="number"
                min={1}
                max={20}
                value={insertionFrequency}
                onChange={(e) => setInsertionFrequency(parseInt(e.target.value) || 3)}
              />
            </div>
            <Button 
              onClick={handleUpdateFrequency}
              disabled={updateSettings.isPending || insertionFrequency === settings?.insertion_frequency}
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Os vídeos explicativos serão exibidos automaticamente no Modo TV entre as apresentações dos cantores.
          </p>
        </CardContent>
      </Card>

      {/* Videos List Card */}
      <Card className="glass-card neon-border-pink">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="neon-text-pink">Vídeos Explicativos</CardTitle>
                <CardDescription>
                  Gerencie os vídeos que serão exibidos entre as apresentações
                </CardDescription>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Vídeo Explicativo</DialogTitle>
                  <DialogDescription>
                    Adicione um vídeo do YouTube para ser exibido entre as apresentações.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Como votar no app"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL do YouTube</Label>
                    <Input
                      id="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newVideo.youtube_url}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, youtube_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={0}
                      placeholder="Ex: 60"
                      value={newVideo.duration_seconds || ''}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Opcional: Ajuda a estimar o tempo total de exibição
                    </p>
                  </div>
                  {getVideoId(newVideo.youtube_url) && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black/20 border border-border">
                      <iframe
                        src={`https://www.youtube.com/embed/${getVideoId(newVideo.youtube_url)}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Preview"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddVideo} disabled={createVideo.isPending}>
                    {createVideo.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {videos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum vídeo explicativo cadastrado</p>
              <p className="text-sm">Adicione vídeos para serem exibidos entre as apresentações</p>
            </div>
          ) : (
            videos?.map((video, index) => {
              const videoId = getVideoId(video.youtube_url);
              return (
                <div 
                  key={video.id} 
                  className={`p-4 rounded-lg border ${video.is_active ? 'bg-background/50 border-border' : 'bg-muted/20 border-muted opacity-60'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-mono">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate">{video.title}</h4>
                        {video.duration_seconds && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      
                      {videoId && (
                        <div className="aspect-video max-w-sm rounded-lg overflow-hidden bg-black/20 border border-border">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${video.id}`} className="text-sm">
                          Ativo
                        </Label>
                        <Switch
                          id={`active-${video.id}`}
                          checked={video.is_active}
                          onCheckedChange={() => handleToggleActive(video)}
                        />
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
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteVideoId(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVideo} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
