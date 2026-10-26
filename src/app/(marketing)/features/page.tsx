import { Bookmark, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { FeatureBento } from "../_components/FeaturesBento";
import {
  BenefitList,
  MarketingCTA,
  PublicPageHeader,
} from "../_components/PublicSections";
export const metadata = createMetadata({
  alternates: { canonical: "/features" },
  title: "Explore Knovest",
  description:
    "Explore Knovest’s community feed, learning resources, live discussions, and educator profiles.",
});
export default function FeaturesPage() {
  return (
    <>
      <PublicPageHeader
        eyebrow="The Knovest experience"
        title="Your learning. All connected."
        description="A place for the questions, conversations, and resources that help you build your financial understanding."
      />
      <FeatureBento />
      <section className="public-section public-section-tinted">
        <div className="public-container">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">Make it your own</p>
              <h2>
                Small tools.
                <br />
                More room to grow.
              </h2>
            </div>
            <p>
              Keep useful ideas close, explore different voices, and build a
              learning space around your interests.
            </p>
          </div>
          <div className="public-two-grid">
            {[
              {
                icon: FileText,
                title: "Go deeper with articles",
                items: [
                  "Read long-form perspectives",
                  "Explore topics beyond a short post",
                  "Discover writing from educators",
                ],
              },
              {
                icon: Bookmark,
                title: "Save what matters",
                items: [
                  "Bookmark useful posts",
                  "Save articles and courses",
                  "Return to ideas at your own pace",
                ],
              },
              {
                icon: MessageCircle,
                title: "Connect through chat",
                items: [
                  "Continue conversations directly",
                  "Join group discussions",
                  "Share questions with your community",
                ],
              },
              {
                icon: ShieldCheck,
                title: "Explore educator profiles",
                items: [
                  "View bios, content, and credentials",
                  "See an educator’s verification status",
                  "Follow perspectives that interest you",
                ],
              },
            ].map(({ icon: Icon, title, items }) => (
              <div className="public-value-card" key={title}>
                <span className="public-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <BenefitList items={items} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <MarketingCTA />
    </>
  );
}
