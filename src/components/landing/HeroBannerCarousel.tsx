import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useHeroCarouselSlides } from '@/hooks/useSiteImages';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBannerCarouselProps {
  className?: string;
}

export function HeroBannerCarousel({ className = '' }: HeroBannerCarouselProps) {
  const { data: slides, isLoading } = useHeroCarouselSlides();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  // Default fallback images
  const defaultSlides = [
    {
      id: 'default',
      desktop_image_url: '/img/mamute-banner-desktop.png',
      tablet_image_url: '/img/mamute-banner-tablet.png',
      mobile_image_url: '/img/mamute-banner-mobile.png',
      link_url: null,
      title: null,
    },
  ];

  const displaySlides = slides && slides.length > 0 ? slides : defaultSlides;
  const showControls = displaySlides.length > 1;

  if (isLoading) {
    return (
      <div className={`hero-banner ${className}`}>
        <div className="w-full aspect-[16/9] lg:aspect-[21/9] bg-landing-dark/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`hero-banner relative ${className}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {displaySlides.map((slide, index) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0">
              {slide.link_url ? (
                <a href={slide.link_url} className="block">
                  <BannerImage slide={slide} />
                </a>
              ) : (
                <BannerImage slide={slide} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showControls && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-landing-orange w-6'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BannerImageProps {
  slide: {
    desktop_image_url: string;
    tablet_image_url?: string | null;
    mobile_image_url?: string | null;
    title?: string | null;
  };
}

function BannerImage({ slide }: BannerImageProps) {
  return (
    <picture>
      <source
        srcSet={slide.desktop_image_url}
        media="(min-width: 1024px)"
      />
      {slide.tablet_image_url && (
        <source
          srcSet={slide.tablet_image_url}
          media="(min-width: 768px)"
        />
      )}
      <img
        src={slide.mobile_image_url || slide.desktop_image_url}
        alt={slide.title || "Mamute Karaokê - Transforme qualquer evento em um karaokê interativo!"}
        className="hero-banner-image"
      />
    </picture>
  );
}
