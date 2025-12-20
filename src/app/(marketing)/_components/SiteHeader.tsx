"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, BookOpen, Radio, Menu, Info, Mail, Layout, LifeBuoy } from "lucide-react";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import React from "react";


export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const handleSignout = useSignOut();


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
        <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/features" className={navigationMenuTriggerStyle()}>
                    Features
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/academy" className={navigationMenuTriggerStyle()}>
                    Academy
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/trade-room" className={navigationMenuTriggerStyle()}>
                    Trade Rooms
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/"
                        >
                          <BrandLogo />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Consensus
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Democratizing Financial Wisdom for the World.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/about" title="About Us">
                      Our mission, vision, and the team behind the platform.
                    </ListItem>
                    <ListItem href="/contact" title="Contact">
                      Get in touch with our support and sales teams.
                    </ListItem>
                    <ListItem href="/features" title="Platform Features">
                      Explore the tools that power your trading journey.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden flex items-center gap-4">
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
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold text-muted-foreground text-sm uppercase px-3 tracking-wider">Platform</h4>
                      <Link href="/features" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Layout className="w-5 h-5 text-muted-foreground" />
                        Features
                      </Link>
                      <Link href="/trade-room" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Radio className="w-5 h-5 text-muted-foreground" />
                        Live Trade Rooms
                      </Link>
                      <Link href="/academy" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                        Academy
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold text-muted-foreground text-sm uppercase px-3 tracking-wider">Platform</h4>
                      <Link href="/about" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Info className="w-5 h-5 text-muted-foreground" />
                        About Us
                      </Link>
                      <Link href="/contact" className="flex items-center gap-4 p-3 rounded-xl text-lg font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        Contact
                      </Link>
                    </div>
                  </div>

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

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href!}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"