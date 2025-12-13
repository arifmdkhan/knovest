import Link from "next/link";
import { Users, Twitter, Instagram, Linkedin, Facebook, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background pt-24 pb-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 group">
                <BrandLogo />
              </Link>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              The institutional-grade social layer for retail investors.
              Connect with verified SEBI registered experts, learn from premium courses, and trade with confidence.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-foreground">Platform</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary transition-colors flex items-center gap-2">Find Mentors</Link></li>
              <li><Link href="/trade-room" className="hover:text-primary transition-colors flex items-center gap-2">Live Trade Rooms <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">LIVE</span></Link></li>
              <li><Link href="/home" className="hover:text-primary transition-colors">Community Feed</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Education Links */}
          <div>
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-foreground">Education</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/academy" className="hover:text-primary transition-colors">Academy</Link></li>
              <li><Link href="/academy/creator" className="hover:text-primary transition-colors">Creator Studio</Link></li>
              <li><Link href="/webinars" className="hover:text-primary transition-colors">Webinars</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-foreground">Important Links</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="https://www.sebi.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">SEBI Official</Link></li>
              <li><Link href="https://www.nism.ac.in/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">NISM Certification</Link></li>
              <li><Link href="https://www.nseindia.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">NSE India</Link></li>
              <li><Link href="https://www.bseindia.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">BSE India</Link></li>

            </ul>
          </div>

          {/* Legal Links (New Column) */}
          <div>
            <h3 className="font-bold mb-6 text-sm uppercase tracking-wider text-foreground">Legal</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © 2025 Consensus Learning Inc. All rights reserved. <br className="md:hidden" />
            <span className="text-muted-foreground/60">Not investment advice. Trading involves risk.</span>
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}