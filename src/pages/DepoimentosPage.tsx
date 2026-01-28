import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';

export default function Depoimentos() {
  return (
    <div className="min-h-screen bg-landing-light">
      <LandingHeader />
      <main className="pt-20">
        <TestimonialsSection />
      </main>
      <CTASection />
      <LandingFooter />
    </div>
  );
}
