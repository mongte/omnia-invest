import { LandingNav } from '@/widgets/landing/landing-nav';
import { LandingFooter } from '@/widgets/landing/landing-footer';
import { HeroSection } from '@/widgets/landing/hero-section';
import { FeaturesSection } from '@/widgets/landing/features-section';
import { DataStatsSection } from '@/widgets/landing/data-stats-section';
import { PreviewSection } from '@/widgets/landing/preview-section';
import { CtaSection } from '@/widgets/landing/cta-section';

export function LandingView() {
  return (
    <div className="flex min-h-screen flex-col scroll-smooth">
      <LandingNav />
      <main className="flex-1 pt-16">
        <HeroSection />
        <FeaturesSection />
        <DataStatsSection />
        <PreviewSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
