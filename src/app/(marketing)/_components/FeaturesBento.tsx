import Image from "next/image";
import Link from "@/components/AppLink";
import {
  ArrowUpRight,
  BookOpen,
  MessageCircle,
  Radio,
  Users,
} from "lucide-react";
const features = [
  {
    icon: Radio,
    title: "Live Trade Rooms",
    text: "Follow live discussions, ask questions, and explore the thinking behind market analysis.",
    href: "/trade-room",
    label: "Explore sessions",
    image: "live-learning",
  },
  {
    icon: BookOpen,
    title: "Knovest Academy",
    text: "Make room for deeper learning with structured courses and thoughtful articles.",
    href: "/academy",
    label: "Explore Academy",
    image: "academy",
  },
  {
    icon: Users,
    title: "Discover educators",
    text: "Discover educators and learners who share your interests and follow their perspectives.",
    href: "/search",
    label: "Explore the community",
    image: "educator",
  },
  {
    icon: MessageCircle,
    title: "A vibrant community",
    text: "Share your ideas, exchange perspectives, and learn together through posts and chat.",
    href: "/home",
    label: "Open the feed",
    image: "community",
  },
];
export function FeatureBento() {
  return (
    <section className="public-section" id="discover">
      <div className="public-container">
        <div className="public-section-heading">
          <div>
            <p className="public-eyebrow">Why Knovest</p>
            <h2>
              Everything you need
              <br />
              to learn and grow.
            </h2>
          </div>
          <p>
            From your first question to a deeper understanding, bring your
            learning and your community together.
          </p>
        </div>
        <div className="public-feature-grid">
          {features.map(({ icon: Icon, title, text, href, label, image }) => (
            <Link href={href} className="public-feature-card group" key={title}>
              <span className="public-icon">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="feature-photo">
                <Image
                  src={`/images/landing/${image}.webp`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
                />
              </div>
              <span className="feature-link">
                {label}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
