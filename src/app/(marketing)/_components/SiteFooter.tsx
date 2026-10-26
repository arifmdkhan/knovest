import Link from "@/components/AppLink";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
const groups = [
  {
    title: "Explore",
    links: [
      ["Features", "/features"],
      ["Academy", "/academy"],
      ["Trade Rooms", "/trade-room"],
      ["Community", "/search"],
    ],
  },
  {
    title: "Knovest",
    links: [
      ["About us", "/about"],
      ["Contact", "/contact"],
      ["Become an educator", "/verification"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms of Service", "/terms"],
      ["Privacy Policy", "/privacy"],
      ["Disclaimer", "/disclaimer"],
    ],
  },
];
export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="public-container">
        <div className="public-footer-grid">
          <div>
            <Link href="/" aria-label="Knovest home">
              <BrandLogo />
            </Link>
            <p>
              A community for curious minds.
              <br />
              Learn. Connect. Ascend.
            </p>
            <Link href="/register" className="feature-link">
              Find your perspective <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h2>{group.title}</h2>
              <nav aria-label={group.title}>
                {group.links.map(([label, href]) => (
                  <Link href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="public-footer-bottom">
          <p>© {new Date().getFullYear()} Knovest. All rights reserved.</p>
          <p>
            For education and discussion.{" "}
            <Link href="/disclaimer">
              Understand the risks <ArrowUpRight className="inline size-3" />
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
