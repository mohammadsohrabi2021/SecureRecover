import Header from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesBento from "@/components/landing/FeaturesBento";
import TrustBadges from "@/components/landing/TrustBadges";
import CtaSection from "@/components/landing/CtaSection";

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-white font-sans">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <FeaturesBento />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
