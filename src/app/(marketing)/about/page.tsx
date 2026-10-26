import Link from "@/components/AppLink";
import {
  ArrowRight,
  BookOpen,
  Compass,
  MessageCircle,
  Users,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import {
  BenefitList,
  MarketingCTA,
  PublicPageHeader,
} from "../_components/PublicSections";
export const metadata = createMetadata({
  alternates: { canonical: "/about" },
  title: "About Knovest",
  description:
    "A community built around financial learning, shared perspectives, and curiosity.",
});
export default function AboutPage() {
  return (
    <>
      <PublicPageHeader
        eyebrow="Our story"
        title="Curiosity brings us together."
        description="We’re building a space where financial learning feels connected. A place to ask better questions, share what you know, and keep growing."
      />
      <section className="public-section">
        <div className="public-container public-showcase">
          <div>
            <p className="public-eyebrow">Our purpose</p>
            <h2>
              Learning is a journey.
              <br />
              You don’t have to go alone.
            </h2>
            <p className="public-lead">
              Ideas often live in one place, courses in another, and
              conversations somewhere else. Knovest brings them together so you
              can spend more time learning.
            </p>
            <p className="public-lead">
              Our mission is to make financial education accessible,
              transparent, and connected through community.
            </p>
          </div>
          <div className="public-value-card mission-card">
            <Compass className="size-12 text-primary" />
            <h3>
              A clearer perspective,
              <br />
              one step at a time.
            </h3>
            <p>
              For learners exploring their first concepts and educators sharing
              years of experience.
            </p>
          </div>
        </div>
      </section>
      <section className="public-section public-section-tinted">
        <div className="public-container">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">What matters to us</p>
              <h2>
                Good learning starts
                <br />
                with good foundations.
              </h2>
            </div>
          </div>
          <div className="public-three-grid">
            {[
              {
                icon: BookOpen,
                title: "Education first",
                text: "Build understanding through ideas, context, and discussion. Financial knowledge takes time and practice.",
              },
              {
                icon: MessageCircle,
                title: "Open perspectives",
                text: "Ask questions, compare viewpoints, and make space for thoughtful conversations.",
              },
              {
                icon: Users,
                title: "Clear identities",
                text: "Explore educator profiles and credentials, and make an informed choice about who you learn from.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div className="public-value-card" key={title}>
                <span className="public-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="public-section">
        <div className="public-container public-showcase">
          <div>
            <p className="public-eyebrow">A place for you</p>
            <h2>
              Bring your questions.
              <br />
              Bring your experience.
            </h2>
            <p className="public-lead">
              Whether you’re here to learn or to teach, there’s value in showing
              up with an open mind.
            </p>
            <Button asChild size="lg">
              <Link href="/register">
                Join the community <ArrowRight />
              </Link>
            </Button>
          </div>
          <BenefitList
            items={[
              "Learn through courses, articles, and conversations",
              "Share knowledge and build your educator profile",
              "Find people with similar learning interests",
              "Save ideas and return when you’re ready",
            ]}
          />
        </div>
      </section>
      <MarketingCTA />
    </>
  );
}
