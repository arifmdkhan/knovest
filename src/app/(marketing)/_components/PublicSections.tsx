import Image from "next/image";
import Link from "@/components/AppLink";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PublicPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="public-page-header">
      <div className="cosmos" aria-hidden="true" />
      <div className="public-container relative">
        <p className="public-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="public-lead">{description}</p>
      </div>
    </section>
  );
}
export function MarketingCTA() {
  return (
    <section className="public-container public-cta">
      <Image
        src="/images/landing/mountain.webp"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 1200px"
        className="cta-landscape"
      />
      <div className="relative">
        <p className="public-eyebrow">Your next step starts here</p>
        <h2>
          Find your perspective.
          <br />
          Build it with Knovest.
        </h2>
        <p>
          Learn something new. Meet a different point of view.
          <br className="hidden sm:block" /> Give your curiosity somewhere to
          grow.
        </p>
        <div className="public-actions">
          <Button asChild size="lg">
            <Link href="/register">
              Get started <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/features">Explore the platform</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function BenefitList({ items }: { items: string[] }) {
  return (
    <ul className="public-benefits">
      {items.map((item) => (
        <li key={item}>
          <span>
            <Check className="size-4" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <PublicPageHeader
        eyebrow="Trust & transparency"
        title={title}
        description={description}
      />
      <div className="public-container public-legal-grid">
        <aside aria-label="Legal pages">
          <p className="public-eyebrow">Useful information</p>
          <nav>
            <Link
              href="/terms"
              aria-current={title === "Terms of Service" ? "page" : undefined}
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              aria-current={title === "Privacy Policy" ? "page" : undefined}
            >
              Privacy Policy
            </Link>
            <Link
              href="/disclaimer"
              aria-current={title === "Disclaimer" ? "page" : undefined}
            >
              Disclaimer
            </Link>
            <Link href="/contact">
              Contact us <ArrowRight className="size-4" />
            </Link>
          </nav>
        </aside>
        <article className="public-legal-content">{children}</article>
      </div>
    </>
  );
}
