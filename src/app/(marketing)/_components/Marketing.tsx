import { HeroSection } from "./HeroSection";
// import { SiteFooter } from "./SiteFooter"; // Removed: In Layout
// import { SiteHeader } from "./SiteHeader"; // Removed: In Layout
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { LazyLoad } from "@/components/LazyLoad";

const FeatureBento = dynamic(() => import("./FeaturesBento").then((mod) => mod.FeatureBento));
const CommunityFeatures = dynamic(() => import("./CommunityFeatures").then((mod) => mod.CommunityFeatures));
const TestimonialsSection = dynamic(() => import("./TestimonialsSection").then((mod) => mod.TestimonialsSection));

export default function MarketingPage() {
  return (
    <>
      <HeroSection />

      {/* <StatsSection /> */}

      <LazyLoad placeholderClassName="min-h-[800px]">
        <CommunityFeatures />
      </LazyLoad>

      <LazyLoad placeholderClassName="min-h-[800px]">
        <FeatureBento />
      </LazyLoad>

      <LazyLoad placeholderClassName="min-h-[600px]">
        <TestimonialsSection />
      </LazyLoad>

      {/* Call To Action Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

        <div className="container px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to find your edge?</h2>
            <p className="text-muted-foreground text-xl mb-10 leading-relaxed">
              Join thousands of investors and certified experts sharing real knowledge.
              No noise. Just Consensus.
            </p>
            <a href="/register" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-lg font-medium text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 hover:scale-105 group">
              Start Learning for Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

          </div>
        </div>

        {/* Decorative Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      </section>
    </>
  );
}