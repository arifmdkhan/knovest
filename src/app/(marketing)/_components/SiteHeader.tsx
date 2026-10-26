"use client";
import { useState } from "react";
import Link from "@/components/AppLink";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { authClient } from "@/lib/auth-client";
const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/academy", label: "Academy" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  return (
    <header className="public-header">
      <a href="#main-content" className="public-skip-link">
        Skip to content
      </a>
      <div className="public-container public-header-inner">
        <Link href="/" aria-label="Knovest home">
          <BrandLogo />
        </Link>
        <nav className="public-desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="public-account-actions" aria-busy={isPending}>
            {session ? (
              <Button asChild>
                <Link href="/home">
                  Open Knovest <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    Get started <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                className="public-menu-trigger"
                variant="outline"
                size="icon"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="public-mobile-menu">
              <SheetTitle className="sr-only">Knovest navigation</SheetTitle>
              <BrandLogo />
              <SheetDescription>Explore Knovest</SheetDescription>
              <nav aria-label="Mobile navigation">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="grid gap-3 mt-auto">
                {session ? (
                  <Button asChild>
                    <Link href="/home" onClick={() => setOpen(false)}>
                      Open Knovest <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild>
                      <Link href="/register" onClick={() => setOpen(false)}>
                        Get started <ArrowRight />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
