import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { InfluencerShowcase } from "@/components/InfluencerShowcase";
import { ProductsSection } from "@/components/ProductsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import ClickSpark from "@/components/ClickSpark";

const Index = () => {
  return (
    <ClickSpark
      sparkColor="#a3d902"
      sparkSize={20}
      sparkRadius={25}
      sparkCount={7}
      duration={300}
    >
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <ProductsSection />
          <InfluencerShowcase />
          <CTASection />
        </main>
        <Footer />
      </div>
    </ClickSpark>
  );
};

export default Index;
