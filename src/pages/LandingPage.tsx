import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { MusicVarietySection } from '@/components/landing/MusicVarietySection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { TargetAudienceSection } from '@/components/landing/TargetAudienceSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { VideoSection } from '@/components/landing/VideoSection';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-dark">
      <LandingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <MusicVarietySection />
        <BenefitsSection />
        <TargetAudienceSection />
        <TestimonialsSection />
        <VideoSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
