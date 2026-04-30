import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import HeroSection from "@/components/sections/HeroSection";
import ServicesPreview from "@/components/sections/ServicesPreview";
import PortfolioPreview from "@/components/sections/PortfolioPreview";
import TransformationsPreview from "@/components/sections/TransformationsPreview";
import AppPreview from "@/components/sections/AppPreview";
import CTASection from "@/components/sections/CTASection";

export default function Home() {
  return (
    <>
      <PublicNavbar />
      <main>
        <HeroSection />
        <ServicesPreview />
        <PortfolioPreview />
        <TransformationsPreview />
        <AppPreview />
        <CTASection />
      </main>
      <PublicFooter />
    </>
  );
}
