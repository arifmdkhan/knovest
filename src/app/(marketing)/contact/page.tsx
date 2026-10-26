import Link from "@/components/AppLink";
import { ArrowRight, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { PublicPageHeader } from "../_components/PublicSections";
export const metadata = createMetadata({
  alternates: { canonical: "/contact" },
  title: "Contact Knovest",
  description:
    "Get in touch about your Knovest account, feedback, or educator enquiries.",
});
export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return (
    <>
      <PublicPageHeader
        eyebrow="Let’s talk"
        title="We’re here to listen."
        description="Have a question, an idea, or something that could work better? We’d like to hear from you."
      />
      <section className="public-section">
        <div className="public-container public-contact-grid">
          <div className="public-value-card public-contact-card">
            <span className="public-icon">
              <Mail />
            </span>
            <h2>Get in touch</h2>
            <p>
              For account support, feedback, educator enquiries, or
              partnerships, reach the Knovest team by email.
            </p>
            {email ? (
              <>
                <a href={`mailto:${email}`} className="contact-address">
                  {email}
                </a>
                <Button asChild size="lg">
                  <a href={`mailto:${email}`}>
                    Email Knovest <ArrowRight />
                  </a>
                </Button>
              </>
            ) : (
              <p className="contact-unavailable">
                Our contact details will be available here soon.
              </p>
            )}
            <p className="text-sm">
              For account issues, include your registered email address and a
              brief description. Please keep passwords and verification codes
              private.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="public-value-card">
              <span className="public-icon">
                <MessageCircle />
              </span>
              <h3>Help shape Knovest</h3>
              <p>
                Share a feature idea or tell us what would make your learning
                experience better.
              </p>
            </div>
            <div className="public-value-card">
              <span className="public-icon">
                <ShieldCheck />
              </span>
              <h3>Looking for more information?</h3>
              <p>
                Read how Knovest works, how information is handled, and the
                terms of using the platform.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-3 mt-5">
                <Link href="/features" className="feature-link">
                  Features <ArrowRight className="size-4" />
                </Link>
                <Link href="/privacy" className="feature-link">
                  Privacy <ArrowRight className="size-4" />
                </Link>
                <Link href="/terms" className="feature-link">
                  Terms <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
