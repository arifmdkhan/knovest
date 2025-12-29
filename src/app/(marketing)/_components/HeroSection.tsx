"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";

export function HeroSection() {


  return (
    <section className="relative w-full min-h-screen pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden bg-background">

      {/* BACKGROUND: Dynamic Gradient & Grid */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[60px] translate-z-0"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/10 opacity-20 blur-[60px] translate-z-0"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">

        {/* TRUST BADGE */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm shadow-sm hover:bg-primary/10 transition-colors cursor-default"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          <span className="font-sans text-xs font-semibold tracking-wide uppercase">Home to Top Financial Experts</span>
        </motion.div>

        {/* HEADLINE */}
        <h1
          className="text-4xl md:text-7xl font-bold tracking-tight max-w-5xl mb-8 leading-[1.1] md:leading-[1.05] animate-fade-in-up"
        >
          Don&apos;t just trade. <br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-blue-500 to-primary/60 animate-gradient-x">
            Learn. Connect. Ascend.
          </span>
        </h1>

        {/* SUBHEAD */}
        <p
          className="text-lg md:text-2xl text-muted-foreground max-w-3xl mb-12 font-light leading-relaxed animate-fade-in-up delay-100"
        >
          The first social network dedicated to financial mastery.
          Join exclusive <span className="text-foreground font-medium">Premium Groups</span>,
          watch <span className="text-foreground font-medium">Live Trade Rooms</span>,
          and access <span className="text-foreground font-medium">verified courses</span>.
        </p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <Link href="/search">
            <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300 rounded-full font-semibold">
              Find a Mentor <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/academy">
            <Button variant="outline" size="lg" className="h-14 px-10 text-lg bg-background/50 backdrop-blur-sm rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300">
              Explore Academy
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-3 max-w-lg text-center"
        >
          <div className="h-px w-24 bg-border/50 mb-4" />
          <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed px-4">
            Are you an expert who loves to teach and mentor about finance, trading, and investment?
          </p>
          <Link href="/verification">
            <Button variant="outline" size="lg" className="h-10 px-8 rounded-full text-primary hover:text-primary hover:bg-primary/5 font-semibold text-base group transition-all duration-300 border-primary/20 hover:border-primary/50 shadow-sm shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02]">
              Get Verified to Start <ShieldCheck className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* HERO VISUAL: 3D Perspective Container */}
        <div className="relative w-full max-w-6xl mt-24 perspective-[2000px]">


          <motion.div
            initial={{ opacity: 0, rotateX: 20, y: 50 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.1 }}
            className="relative w-full aspect-video md:aspect-21/9 rounded-2xl border border-border/50 bg-card/50 shadow-2xl overflow-hidden backdrop-blur-sm group flex flex-col md:flex-row ring-1 ring-white/10 translate-z-0"
          >
            {/* LEFT: Live Stream Area */}
            <div className="flex-1 bg-black/5 relative overflow-hidden flex flex-col">
              {/* Fake Video Header */}
              <div className="absolute top-6 left-6 z-10 flex gap-3">
                <Badge variant="destructive" className="animate-pulse shadow-lg shadow-red-500/20">LIVE</Badge>
                <Badge variant="secondary" className="bg-black/40 text-white border-0 backdrop-blur-sm">
                  <Users className="w-3 h-3 mr-1.5" /> 1.2k Watching
                </Badge>
              </div>

              {/* Abstract Chart/Stream Content */}
              <div className="flex-1 flex items-center justify-center bg-linear-to-br from-muted/30 to-muted/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] opacity-50"></div>

                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse ring-4 ring-primary/5">
                  <Play className="w-10 h-10 text-primary fill-primary ml-1" />
                </div>

                {/* Decorative Chart Lines */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 60 50 80 100 20" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-primary" />
                    <path d="M0 100 L 100 100 L 100 20 Z" fill="url(#gradient)" className="opacity-20" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" className="text-primary" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Stream Footer */}
              <div className="h-20 border-t border-border/10 bg-card/80 backdrop-blur-sm p-5 flex items-center gap-4">

                <div className="text-left overflow-hidden">
                  <div className="text-base font-bold truncate">Nifty 50 Live Scalping Session</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                    <UserAvatarWithInfo image={null} name="Prashant Mehta" username="prashant" expertVerificationType="SEBI" accountVerificationType="VERIFIED_USER" />

                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Chat/Interaction Panel (Hidden on Mobile) */}
            <div className="w-96 border-l border-border/50 bg-card/30 hidden md:flex flex-col backdrop-blur-sm">
              <div className="p-4 border-b border-border/50 text-sm font-semibold flex justify-between items-center bg-muted/30">
                <span>Premium Chat</span>
                <Badge variant="outline" className="text-[10px] h-5">PRO</Badge>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                <div className="absolute inset-x-0 top-12 h-12 bg-linear-to-b from-card/80 to-transparent z-10 pointer-events-none" />

                {/* Mock Chat Messages */}
                <div className="space-y-3 opacity-60">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 shrink-0" />
                    <div className="bg-muted/50 rounded-lg rounded-tl-none p-2 text-xs">
                      Looking for a breakout at 26,000
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0" />
                    <div className="bg-primary/10 text-primary rounded-lg rounded-tr-none p-2 text-xs">
                      Volume is picking up! 🚀
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 shrink-0" />
                    <div className="bg-muted/50 rounded-lg rounded-tl-none p-2 text-xs">
                      Stop loss adjusted.
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-4 border-t border-border/50 bg-muted/20">
                <div className="h-10 rounded-full bg-background/50 border border-border/50 flex items-center px-4 text-xs text-muted-foreground shadow-inner">
                  Message the group...
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}