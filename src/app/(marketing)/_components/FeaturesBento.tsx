"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Users, Star,  TrendingUp, Mic, Monitor } from "lucide-react";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";

export function FeatureBento() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 text-sm bg-primary/5 backdrop-blur-sm">
            Learn & Earn
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Master the Markets. <span className="text-primary">Live.</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Join live trading rooms with experts or master strategies at your own pace with our premium courses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* LEFT: Trade Room Preview (75%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 w-full"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl group">
              {/* Window Controls */}
              <div className="h-10 bg-muted/50 border-b border-border/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                <div className="ml-4 text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Live Trade Room - Bank Nifty Expiry Special
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative aspect-video bg-black/90 flex">
                {/* Video Area */}
                <div className="flex-1 relative overflow-hidden">
                  {/* Mock Chart/Screen Share */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 80 L 10 75 L 20 78 L 30 60 L 40 65 L 50 50 L 60 55 L 70 40 L 80 45 L 90 30 L 100 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-green-500" />
                    <path d="M0 90 L 10 85 L 20 88 L 30 70 L 40 75 L 50 60 L 60 65 L 70 50 L 80 55 L 90 40 L 100 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-500" />
                  </svg>

                  {/* Presenter Overlay */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg overflow-hidden">
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="/avatars/01.png" />
                        <AvatarFallback>KV</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white font-medium flex items-center gap-1">
                      <Mic className="w-2 h-2" /> Kunal Verma
                    </div>
                  </div>

                  {/* Live Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge variant="destructive" className="animate-pulse px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                      Live
                    </Badge>
                    <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white flex items-center gap-1">
                      <Users className="w-3 h-3" /> 874 watching
                    </div>
                  </div>
                </div>

                {/* Chat Overlay (Right Side) */}
                <div className="w-64 bg-zinc-900/90 border-l border-zinc-800 flex flex-col hidden md:flex">
                  <div className="p-3 border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Live Chat
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {[
                      { user: "TraderJoe", msg: "Breakout confirmed! 🚀", color: "text-blue-400" },
                      { user: "Alice_W", msg: "What's the SL?", color: "text-pink-400" },
                      { user: "CryptoKing", msg: "Volume is spiking.", color: "text-green-400" },
                      { user: "NiftyMaster", msg: "Taking partials here.", color: "text-yellow-400" },
                      { user: "Newbie101", msg: "Thanks for the analysis!", color: "text-purple-400" },
                    ].map((chat, i) => (
                      <div key={i} className="text-xs">
                        <span className={`font-bold ${chat.color} mr-1`}>{chat.user}:</span>
                        <span className="text-zinc-300">{chat.msg}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-zinc-800">
                    <div className="bg-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-500">
                      Send a message...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Course Card Preview (25%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 w-full h-full"
          >
            <Card className="h-full border-border/50 bg-card/80 backdrop-blur-xl p-0 shadow-xl hover:border-primary/30 transition-all duration-300 group flex flex-col">
              {/* Course Thumbnail */}
              <div className="relative aspect-4/3 bg-muted overflow-hidden rounded-t-xl">
                <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-purple-600/20 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-primary/40" />
                </div>
                <Badge className="absolute top-3 right-3 bg-yellow-500 text-black font-bold hover:bg-yellow-400">
                  Bestseller
                </Badge>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-yellow-500 mb-2">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs text-muted-foreground ml-1">(4.9)</span>
                </div>

                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                  Technical Analysis Masterclass
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  Master chart patterns, indicators, and price action trading with a SEBI registered expert.
                </p>

                <div className="flex items-center gap-2 mb-6">

                   <UserAvatarWithInfo image={'./profile1.jpeg'} name="Prashant Mehta" username="prashant" isVerified={true} isSebiVerified={true} />
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">₹2,999</div>
                 
                  </div>
                  <Button size="sm" className="rounded-full px-4 shadow-lg shadow-primary/20" aria-label="Buy Technical Analysis Masterclass">
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
}