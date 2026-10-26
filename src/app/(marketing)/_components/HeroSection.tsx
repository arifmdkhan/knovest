import Image from "next/image";
import Link from "@/components/AppLink";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="public-hero">
      <div className="cosmos" aria-hidden="true" />
      <div className="public-container hero-grid">
        <div className="hero-copy">
          <p className="public-eyebrow">
            A new perspective on financial learning
          </p>
          <h1>
            Don’t just trade.
            <br />
            Learn. Connect.
            <br />
            <span className="text-primary">Ascend.</span>
          </h1>
          <p className="public-lead">
            Explore ideas, learn from educators, and find your community. Build
            your understanding of the markets, one conversation at a time.
          </p>
          <div className="public-actions">
            <Button asChild size="lg">
              <Link href="/register">
                Start learning <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/academy">
                <BookOpen /> Explore Academy
              </Link>
            </Button>
          </div>
          <p className="hero-footnote">
            <Users className="size-4" /> For curious minds. At every stage of
            the journey.
          </p>
        </div>
        <figure className="hero-product">
          <Image
            src="/images/landing/hero-laptop.webp"
            alt="Illustration of an educator teaching in a Knovest live learning room on a laptop"
            width={1280}
            height={853}
            sizes="(max-width: 900px) 100vw, 60vw"
            preload
            fetchPriority="high"
          />
          <figcaption>
            Discover a more connected way to learn. Illustrative preview.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
