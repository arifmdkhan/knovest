"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, BookOpen, Radio, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authClient } from "@/lib/auth-client";
import useSignOut from "@/hooks/use-signout";
import { BrandLogo } from "@/components/brand-logo";


export function SiteHeader() {
  const { data: session } = authClient.useSession()
  const handleSignout = useSignOut()


  const scrollPosition = useScrollPosition();
  const scrolled = scrollPosition > 20;

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-border/50 shadow-sm"
          : "bg-background/0"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="Home">
          <BrandLogo />
        </Link>

        {/* Desktop Nav - Learning Focused */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link href="/search" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Find Mentors
          </Link>
          <Link href="/trade-room" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <Radio className="w-4 h-4" /> Live Trade Rooms
          </Link>
          <Link href="/academy" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <BookOpen className="w-4 h-4" /> Academy
          </Link>
        </nav>

        {/* Mobile Nav */}
        <div className="lg:hidden flex items-center gap-4">
          {/* Auth Actions (Mobile - Compact) */}
          {session ? (
            <></> // User likely accesses profile via avatar or menu. Let's keep it simple for now or maybe just the menu.
          ) : (
            <Link href="/register">
              <Button size="sm" className="font-semibold shadow-lg shadow-primary/20 rounded-full px-4">
                Join
              </Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l-0 p-0 shadow-2xl bg-background/95 backdrop-blur-xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/40">
                  <Link href="/" className="flex items-center gap-2" onClick={() => { }}>
                    <BrandLogo />
                  </Link>
                  <ThemeToggle />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-8 p-6 overflow-y-auto">
                  <nav className="flex flex-col gap-2">
                    <Link href="/search" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-5 h-5" />
                      </div>
                      Find Mentors
                    </Link>
                    <Link href="/trade-room" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Radio className="w-5 h-5" />
                      </div>
                      Live Trade Rooms
                    </Link>
                    <Link href="/academy" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      Academy
                    </Link>
                  </nav>

                  <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-border/40">
                    {session ? (
                      <>
                        <Link href="/home" className="w-full">
                          <Button className="w-full h-12 text-base justify-start" variant="outline">
                            Home
                          </Button>
                        </Link>
                        <Button className="w-full h-12 text-base justify-start text-muted-foreground" variant="ghost" onClick={handleSignout}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="w-full">
                          <Button variant="outline" className="w-full h-12 text-base border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/register" className="w-full">
                          <Button className="w-full h-12 text-base shadow-xl shadow-primary/25 font-semibold">
                            Join Consensus
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Auth Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <>
              <Button className="mr-2" onClick={handleSignout}>Logout</Button>
              <Link href="/home">
                <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                  Home
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold shadow-lg shadow-primary/20 rounded-full px-6">
                  Sign Up
                </Button>
              </Link>
            </>
          )

          }

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}