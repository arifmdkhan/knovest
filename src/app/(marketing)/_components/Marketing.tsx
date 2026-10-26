import Image from "next/image";
import Link from "@/components/AppLink";
import { ArrowRight, BookOpen, Bookmark, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "./HeroSection";
import { FeatureBento } from "./FeaturesBento";
import { BenefitList, MarketingCTA } from "./PublicSections";
export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <div className="public-container public-pillars">
        {[
          {
            icon: Users,
            title: "Connect",
            text: "A community of perspectives",
          },
          {
            icon: Radio,
            title: "Participate",
            text: "Conversations in real time",
          },
          {
            icon: BookOpen,
            title: "Learn",
            text: "Make progress at your pace",
          },
          { icon: Bookmark, title: "Build", text: "Your own library of ideas" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
      <FeatureBento />
      <section className="public-section">
        <div className="public-container public-showcase">
          <div>
            <p className="public-eyebrow">Learn from experience</p>
            <h2>
              Different perspectives.
              <br />
              Deeper understanding.
            </h2>
            <p className="public-lead">
              Follow people who make you think. Share what you’re learning and
              turn a passing idea into a conversation.
            </p>
            <Button asChild size="lg">
              <Link href="/search">
                Explore the community <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="community-illustration">
            <Link href="/search" className="showcase-photo-card group">
              <div className="showcase-photo">
                <Image
                  src="/images/landing/educator.webp"
                  alt="Illustrative portrait of an educator sharing a financial concept"
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1100px) 40vw, 25vw"
                />
              </div>
              <div className="showcase-photo-caption">
                <span className="public-eyebrow">
                  Learn from new perspectives
                </span>
                <h3>Knowledge worth sharing.</h3>
                <span className="feature-link">
                  Discover educators <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
            <BenefitList
              items={[
                "Discover educators and their credentials",
                "Follow the topics that interest you",
                "Continue the conversation in chat",
              ]}
            />
          </div>
        </div>
      </section>
      <section className="public-section public-section-tinted">
        <div className="public-container public-showcase">
          <div>
            <p className="public-eyebrow">Knovest Academy</p>
            <h2>
              A little more knowledge.
              <br />A clearer way forward.
            </h2>
            <p className="public-lead">
              Go beyond the feed. Explore courses and articles, save useful
              lessons, and return when you’re ready for the next step.
            </p>
            <Button asChild size="lg">
              <Link href="/academy">
                Explore Academy <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="learning-illustration">
            <Link href="/academy" className="showcase-photo-card group">
              <div className="showcase-photo">
                <Image
                  src="/images/landing/academy.webp"
                  alt="Illustrative image of an educator teaching an online course"
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1100px) 40vw, 25vw"
                />
              </div>
              <div className="showcase-photo-caption">
                <span className="public-eyebrow">Knovest Academy</span>
                <h3>Always a new chapter.</h3>
                <span className="feature-link">
                  Discover courses <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
            <BenefitList
              items={[
                "Structured chapters and lessons",
                "Articles for a deeper understanding",
                "A learning journey at your own pace",
              ]}
            />
          </div>
        </div>
      </section>
      <section className="public-section">
        <div className="public-container public-faq">
          <div>
            <p className="public-eyebrow">A few things to know</p>
            <h2>Start with curiosity.</h2>
            <p className="public-lead">
              A little clarity before you get started.
            </p>
            <Link href="/contact" className="feature-link">
              Get in touch <ArrowRight className="size-4" />
            </Link>
          </div>
          <div>
            {[
              {
                q: "What is Knovest?",
                a: "Knovest brings financial learning and community together through posts, courses, articles, chat, and live discussions.",
              },
              {
                q: "Do I need trading experience?",
                a: "You can explore Knovest at any stage of your learning. Read course details and educator profiles to find a starting point that suits you.",
              },
              {
                q: "Can I share my knowledge as an educator?",
                a: "Create an account and visit Expert Verification to submit your credentials for review. Your profile can bring together your posts, courses, and articles.",
              },
              {
                q: "Is the content investment advice?",
                a: "Knovest is for education and discussion. Content does not promise returns or replace advice from a qualified professional. Read our disclaimer for more information.",
              },
            ].map(({ q, a }) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <MarketingCTA />
    </>
  );
}
