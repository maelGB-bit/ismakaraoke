import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, Search, Play, AlertCircle, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { decodeHtmlEntities } from '@/lib/htmlUtils';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

interface TVAddSingerDialogProps {
  onAddToWaitlist: (singerName: string, youtubeUrl: string, songTitle: string, registeredBy?: string, insertFirst?: boolean) => Promise<boolean>;
  onFetchSuggestions?: () => Promise<string[]>;
  container?: HTMLElement | null;
}

export function TVAddSingerDialog({ onAddToWaitlist, onFetchSuggestions, container }: TVAddSingerDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [singerName, setSingerName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [insertFirst, setInsertFirst] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // YouTube search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery.trim() },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setSearchResults(data.videos || []);

      if (data.videos?.length === 0) {
        toast({ title: t('youtube.noVideoFound'), description: t('youtube.tryOtherTerms') });
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast({ title: t('youtube.searchError'), description: t('youtube.cantSearchVideos'), variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    const cleanTitle = decodeHtmlEntities(video.title)
      .replace(/\(.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\)/gi, '')
      .replace(/\[.*?(karaoke|versão|version|lyrics|lyric|instrumental).*?\]/gi, '')
      .replace(/karaoke|versão karaokê/gi, '')
      .trim()
      .substring(0, 50);
    
    setSelectedVideo(video);
    setYoutubeUrl(video.url);
    setSongTitle(cleanTitle);
  };

  const handleSubmit = async () => {
    if (!singerName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Preencha o nome do cantor', variant: 'destructive' });
      return;
    }
    
    if (!youtubeUrl.trim() || !songTitle.trim()) {
      toast({ title: 'Música obrigatória', description: 'Selecione uma música', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const success = await onAddToWaitlist(singerName.trim(), youtubeUrl, songTitle, undefined, insertFirst);
    setIsSubmitting(false);

    if (success) {
      toast({ 
        title: insertFirst ? '🎤 Próximo na fila!' : 'Adicionado à fila!', 
        description: `${singerName.trim()} - ${songTitle}` 
      });
      // Reset form
      setSingerName('');
      setSongTitle('');
      setYoutubeUrl('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedVideo(null);
      setOpen(false);
    }
  };

  const resetForm = () => {
    setSingerName('');
    setSongTitle('');
    setYoutubeUrl('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedVideo(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-primary/30 hover:bg-primary/10"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Inscrever cantor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" container={container}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Inscrever novo cantor
          </DialogTitle>
          <DialogDescription>
            Adicione um cantor à fila de espera
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Singer Name */}
          <div className="space-y-2">
            <Label htmlFor="singer-name">Nome do cantor</Label>
            <Input
              id="singer-name"
              value={singerName}
              onChange={(e) => setSingerName(e.target.value)}
              placeholder="Ex: João Silva"
              autoFocus
            />
          </div>

          {/* Queue Position */}
          {singerName.trim() && (
            <div className="p-3 rounded-md bg-muted/50 border border-border">
              <span className="text-xs font-medium mb-2 block">Posição na fila</span>
              <RadioGroup
                value={insertFirst ? 'first' : 'fair'}
                onValueChange={(value) => setInsertFirst(value === 'first')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="first" id="tv-position-first" />
                  <Label htmlFor="tv-position-first" className="text-sm font-normal cursor-pointer">
                    🎤 Será o próximo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="tv-position-fair" />
                  <Label htmlFor="tv-position-fair" className="text-sm font-normal cursor-pointer">
                    ⚖️ Ordem justa
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* YouTube Search Tabs */}
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2 text-xs">
                <Search className="h-3 w-3" />
                Buscar música
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2 text-xs">
                <Link className="h-3 w-3" />
                Colar URL
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Buscar no YouTube..."
                    className="pl-10"
                    disabled={isSearching}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching} variant="secondary" size="sm">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>

              {selectedVideo && (
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2">
                    <img src={selectedVideo.thumbnail} alt="" className="w-16 h-9 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{decodeHtmlEntities(selectedVideo.title)}</p>
                      <p className="text-xs text-muted-foreground">{selectedVideo.channelTitle}</p>
                    </div>
                  </div>
                </div>
              )}

              {searchResults.length > 0 && !selectedVideo && (
                <ScrollArea className="h-[200px] rounded-lg border border-border bg-background/50">
                  <div className="p-2 space-y-2">
                    {searchResults.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="relative flex-shrink-0">
                          <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded-md" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <Play className="h-4 w-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs line-clamp-2">{decodeHtmlEntities(video.title)}</p>
                          <p className="text-xs text-muted-foreground truncate">{video.channelTitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="song-title-manual">Título da música</Label>
                <Input
                  id="song-title-manual"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Ex: Evidências"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube-url-manual">URL do YouTube</Label>
                <Input
                  id="youtube-url-manual"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !singerName.trim() || !youtubeUrl.trim() || !songTitle.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Adicionar à fila
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
