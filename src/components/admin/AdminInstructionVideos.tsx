import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader2, Plus, Save, Trash2, GripVertical, Play, ExternalLink, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  useInstructionVideos, 
  useCreateInstructionVideo,
  useUpdateInstructionVideo,
  useDeleteInstructionVideo,
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
import { supabase } from '@/integrations/supabase/client';

export function AdminInstructionVideos() {
  const { data: videos, isLoading } = useInstructionVideos();
  const createVideo = useCreateInstructionVideo();
  const updateVideo = useUpdateInstructionVideo();
  const deleteVideo = useDeleteInstructionVideo();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<InstructionVideo | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: '',
    duration_seconds: 0,
    button_name: 'Assistir',
  });
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

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

  // Fetch video duration from YouTube using our edge function
  const fetchVideoDuration = async (url: string, isEdit = false): Promise<void> => {
    const videoId = getVideoId(url);
    if (!videoId) return;
    
    setIsLoadingDuration(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-video-duration', {
        body: { videoId },
      });
      
      if (!error && data && data.duration_seconds) {
        if (isEdit && editingVideo) {
          setEditingVideo(prev => prev ? { 
            ...prev, 
            duration_seconds: data.duration_seconds,
            title: prev.title || data.title || prev.title
          } : null);
        } else {
          setNewVideo(prev => ({ 
            ...prev, 
            duration_seconds: data.duration_seconds,
            title: prev.title || data.title || ''
          }));
        }
        toast({
          title: 'Duração obtida',
          description: `${Math.floor(data.duration_seconds / 60)}:${String(data.duration_seconds % 60).padStart(2, '0')}`,
        });
      }
    } catch (error) {
      console.error('Error fetching video duration:', error);
    } finally {
      setIsLoadingDuration(false);
    }
  };

  // Auto-fetch duration when URL changes
  const handleUrlChange = async (url: string, isEdit = false) => {
    if (isEdit && editingVideo) {
      setEditingVideo({ ...editingVideo, youtube_url: url });
    } else {
      setNewVideo(prev => ({ ...prev, youtube_url: url }));
    }
    
    // Auto-fetch duration when a valid video ID is detected
    const videoId = getVideoId(url);
    if (videoId) {
      await fetchVideoDuration(url, isEdit);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.youtube_url || !newVideo.button_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título, URL do vídeo e nome do botão.',
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
        button_name: newVideo.button_name,
      });
      toast({
        title: 'Vídeo adicionado',
        description: 'O vídeo foi adicionado com sucesso.',
      });
      setNewVideo({ title: '', youtube_url: '', duration_seconds: 0, button_name: 'Assistir' });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const handleEditVideo = async () => {
    if (!editingVideo) return;
    
    if (!editingVideo.title || !editingVideo.youtube_url || !editingVideo.button_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título, URL do vídeo e nome do botão.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateVideo.mutateAsync({
        id: editingVideo.id,
        title: editingVideo.title,
        youtube_url: editingVideo.youtube_url,
        duration_seconds: editingVideo.duration_seconds || null,
        button_name: editingVideo.button_name,
      });
      toast({
        title: 'Vídeo atualizado',
        description: 'O vídeo foi atualizado com sucesso.',
      });
      setEditingVideo(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (video: InstructionVideo) => {
    setEditingVideo({ ...video });
    setIsEditDialogOpen(true);
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
      {/* Videos List Card */}
      <Card className="glass-card neon-border-pink">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="neon-text-pink">Vídeos Explicativos</CardTitle>
                <CardDescription>
                  Gerencie os vídeos explicativos que podem ser acionados pelos coordenadores
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
                    Adicione um vídeo do YouTube que coordenadores podem acionar manualmente.
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
                    <Label htmlFor="button_name">Nome do Botão</Label>
                    <Input
                      id="button_name"
                      placeholder="Ex: Como Votar"
                      value={newVideo.button_name}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, button_name: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Este texto aparecerá no botão para o coordenador
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="url">URL do YouTube</Label>
                    <Input
                      id="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newVideo.youtube_url}
                      onChange={(e) => handleUrlChange(e.target.value, false)}
                      disabled={isLoadingDuration}
                    />
                    {isLoadingDuration && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Buscando duração do vídeo...
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="duration"
                        type="number"
                        min={0}
                        placeholder="Ex: 60"
                        value={newVideo.duration_seconds || ''}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                        className="flex-1"
                      />
                      {newVideo.duration_seconds > 0 && (
                        <div className="flex items-center px-3 bg-muted rounded-md text-sm font-mono">
                          {Math.floor(newVideo.duration_seconds / 60)}:{String(newVideo.duration_seconds % 60).padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Preenchido automaticamente ao inserir a URL
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
              <p className="text-sm">Adicione vídeos que coordenadores poderão acionar manualmente</p>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{video.title}</h4>
                        {video.duration_seconds && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Botão:</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                          {video.button_name}
                        </span>
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
                        onClick={() => openEditDialog(video)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
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

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vídeo Explicativo</DialogTitle>
            <DialogDescription>
              Altere as informações do vídeo.
            </DialogDescription>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  placeholder="Ex: Como votar no app"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-button_name">Nome do Botão</Label>
                <Input
                  id="edit-button_name"
                  placeholder="Ex: Como Votar"
                  value={editingVideo.button_name}
                  onChange={(e) => setEditingVideo({ ...editingVideo, button_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este texto aparecerá no botão para o coordenador
                </p>
              </div>
              <div>
                <Label htmlFor="edit-url">URL do YouTube</Label>
                <Input
                  id="edit-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={editingVideo.youtube_url}
                  onChange={(e) => handleUrlChange(e.target.value, true)}
                  disabled={isLoadingDuration}
                />
                {isLoadingDuration && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Buscando duração do vídeo...
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-duration">Duração (segundos)</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-duration"
                    type="number"
                    min={0}
                    placeholder="Ex: 60"
                    value={editingVideo.duration_seconds || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration_seconds: parseInt(e.target.value) || null })}
                    className="flex-1"
                  />
                  {editingVideo.duration_seconds && editingVideo.duration_seconds > 0 && (
                    <div className="flex items-center px-3 bg-muted rounded-md text-sm font-mono">
                      {Math.floor(editingVideo.duration_seconds / 60)}:{String(editingVideo.duration_seconds % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Preenchido automaticamente ao inserir a URL
                </p>
              </div>
              {getVideoId(editingVideo.youtube_url) && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black/20 border border-border">
                  <iframe
                    src={`https://www.youtube.com/embed/${getVideoId(editingVideo.youtube_url)}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Preview"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditVideo} disabled={updateVideo.isPending}>
              {updateVideo.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
