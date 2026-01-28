import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Loader2, Plus, Trash2, GripVertical, Upload, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAllHeroCarouselSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  useSiteImages,
  useUpdateSiteImage,
  uploadSiteImage,
  type HeroCarouselSlide,
} from '@/hooks/useSiteImages';
import { useToast } from '@/hooks/use-toast';

export function AdminSiteImages() {
  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-card neon-border-pink">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Image className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="neon-text-pink">Imagens do Site</CardTitle>
              <CardDescription>
                Gerencie as imagens do carrossel principal e outras imagens do site
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="carousel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="carousel">Banner Carrossel</TabsTrigger>
              <TabsTrigger value="images">Outras Imagens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="carousel" className="mt-6">
              <CarouselManager />
            </TabsContent>
            
            <TabsContent value="images" className="mt-6">
              <SiteImagesManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CarouselManager() {
  const { data: slides, isLoading } = useAllHeroCarouselSlides();
  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const deleteSlide = useDeleteHeroSlide();
  const { toast } = useToast();
  const [expandedSlide, setExpandedSlide] = useState<string | null>(null);

  const handleCreateSlide = async () => {
    try {
      // Get next sort order
      const nextOrder = slides?.length ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;
      
      await createSlide.mutateAsync({
        title: `Slide ${nextOrder + 1}`,
        desktop_image_url: '/img/mamute-banner-desktop.png',
        tablet_image_url: '/img/mamute-banner-tablet.png',
        mobile_image_url: '/img/mamute-banner-mobile.png',
        link_url: null,
        sort_order: nextOrder,
        is_active: true,
      });
      
      toast({ title: 'Slide criado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao criar slide', variant: 'destructive' });
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este slide?')) return;
    
    try {
      await deleteSlide.mutateAsync(id);
      toast({ title: 'Slide excluído' });
    } catch (error) {
      toast({ title: 'Erro ao excluir slide', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (slide: HeroCarouselSlide) => {
    try {
      await updateSlide.mutateAsync({ id: slide.id, is_active: !slide.is_active });
      toast({ title: slide.is_active ? 'Slide desativado' : 'Slide ativado' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar slide', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure as imagens do carrossel principal. Cada slide pode ter versões para desktop, tablet e mobile.
        </p>
        <Button onClick={handleCreateSlide} disabled={createSlide.isPending}>
          {createSlide.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Adicionar Slide
        </Button>
      </div>

      {slides?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum slide configurado.</p>
          <p className="text-sm">Clique em "Adicionar Slide" para começar.</p>
        </div>
      )}

      <div className="space-y-3">
        {slides?.map((slide, index) => (
          <SlideEditor
            key={slide.id}
            slide={slide}
            index={index}
            isExpanded={expandedSlide === slide.id}
            onToggleExpand={() => setExpandedSlide(expandedSlide === slide.id ? null : slide.id)}
            onUpdate={updateSlide.mutateAsync}
            onDelete={() => handleDeleteSlide(slide.id)}
            onToggleActive={() => handleToggleActive(slide)}
            isPending={updateSlide.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface SlideEditorProps {
  slide: HeroCarouselSlide;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (data: Partial<HeroCarouselSlide> & { id: string }) => Promise<any>;
  onDelete: () => void;
  onToggleActive: () => void;
  isPending: boolean;
}

function SlideEditor({
  slide,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onToggleActive,
  isPending,
}: SlideEditorProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<'desktop' | 'tablet' | 'mobile' | null>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const tabletInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    file: File,
    type: 'desktop' | 'tablet' | 'mobile'
  ) => {
    setUploading(type);
    try {
      const path = `carousel/${slide.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadSiteImage(file, path);
      
      const updateKey = type === 'desktop' 
        ? 'desktop_image_url' 
        : type === 'tablet' 
          ? 'tablet_image_url' 
          : 'mobile_image_url';
      
      await onUpdate({ id: slide.id, [updateKey]: url });
      toast({ title: 'Imagem atualizada' });
    } catch (error) {
      toast({ title: 'Erro ao fazer upload', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background/50 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium flex-1">
          {slide.title || `Slide ${index + 1}`}
        </span>
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={slide.is_active}
              onCheckedChange={() => onToggleActive()}
            />
          </div>
          {slide.is_active ? (
            <Eye className="w-4 h-4 text-green-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-border">
          {/* Title */}
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input
              value={slide.title || ''}
              onChange={(e) => onUpdate({ id: slide.id, title: e.target.value || null })}
              placeholder="Título do slide"
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label>Link (opcional)</Label>
            <Input
              value={slide.link_url || ''}
              onChange={(e) => onUpdate({ id: slide.id, link_url: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Desktop */}
            <div className="space-y-2">
              <Label>Desktop (1920x?)</Label>
              <input
                ref={desktopInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'desktop');
                }}
              />
              <div 
                className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                onClick={() => desktopInputRef.current?.click()}
              >
                {slide.desktop_image_url ? (
                  <img 
                    src={slide.desktop_image_url} 
                    alt="Desktop" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {uploading === 'desktop' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Tablet */}
            <div className="space-y-2">
              <Label>Tablet (768x?)</Label>
              <input
                ref={tabletInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'tablet');
                }}
              />
              <div 
                className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                onClick={() => tabletInputRef.current?.click()}
              >
                {slide.tablet_image_url ? (
                  <img 
                    src={slide.tablet_image_url} 
                    alt="Tablet" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {uploading === 'tablet' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label>Mobile (375x?)</Label>
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'mobile');
                }}
              />
              <div 
                className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                onClick={() => mobileInputRef.current?.click()}
              >
                {slide.mobile_image_url ? (
                  <img 
                    src={slide.mobile_image_url} 
                    alt="Mobile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {uploading === 'mobile' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteImagesManager() {
  const { data: images, isLoading } = useSiteImages();
  const updateImage = useUpdateSiteImage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (id: string, key: string, file: File) => {
    setUploading(key);
    try {
      const path = `site/${key}-${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadSiteImage(file, path);
      await updateImage.mutateAsync({ id, image_url: url });
      toast({ title: 'Imagem atualizada' });
    } catch (error) {
      toast({ title: 'Erro ao fazer upload', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gerencie as imagens utilizadas em diferentes partes do site.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images?.map((image) => (
          <ImageUploader
            key={image.id}
            image={image}
            isUploading={uploading === image.key}
            onUpload={(file) => handleFileUpload(image.id, image.key, file)}
          />
        ))}
      </div>
    </div>
  );
}

interface ImageUploaderProps {
  image: { id: string; key: string; title: string; description: string | null; image_url: string | null };
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function ImageUploader({ image, isUploading, onUpload }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4 rounded-lg border border-border bg-background/50 space-y-3">
      <div>
        <h4 className="font-medium">{image.title}</h4>
        {image.description && (
          <p className="text-sm text-muted-foreground">{image.description}</p>
        )}
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      
      <div 
        className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
        onClick={() => inputRef.current?.click()}
      >
        {image.image_url ? (
          <img 
            src={image.image_url} 
            alt={image.title} 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Upload className="w-8 h-8 mb-2" />
            <p className="text-sm">Clique para fazer upload</p>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
