"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, TrendingUp, CheckCircle2, MoreVertical, Send, Search, Repeat2, Crown } from "lucide-react";

export function CommunityFeatures() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[60px] -z-10 translate-z-0" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 text-sm bg-primary/5 backdrop-blur-sm">
                        Community Powered
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        Trade Together. <span className="text-primary">Win Together.</span>
                    </h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                        Experience the power of social finance with real-time feeds and premium chat groups.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-stretch">

                    {/* LEFT: Feed Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex-1"
                    >
                        <div className="h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-primary/20 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl -z-10 translate-z-0" />

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-blue-500" /> Live Feed
                                </h3>
                                <p className="text-muted-foreground">
                                    Real-time trade setups, analysis, and market sentiment from verified experts.
                                </p>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm shadow-xl transform group-hover:scale-[1.02] transition-transform duration-500">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                                        <div className="flex gap-3">
                                            <div>
                                                <UserAvatarWithInfo image={'AK'} name="Arif Md Khan" username="amk" isVerified={true} />

                                            </div>
                                            <p className="text-sm text-muted-foreground">• 2m ago</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pb-3">
                                        <p className="text-sm leading-relaxed">
                                            <span className="text-blue-500 font-medium">$NIFTY</span> breaking out of the ascending triangle. Volume confirming.
                                        </p>

                                        {/* Mock Chart Area */}
                                        <div className="relative aspect-video bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                                            <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
                                                <path
                                                    d="M0 40 L 10 35 L 20 38 L 30 25 L 40 30 L 50 20 L 60 22 L 70 10 L 80 15 L 90 5 L 100 2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="text-green-500"
                                                />
                                                <path
                                                    d="M0 40 L 10 35 L 20 38 L 30 25 L 40 30 L 50 20 L 60 22 L 70 10 L 80 15 L 90 5 L 100 2 L 100 50 L 0 50 Z"
                                                    fill="url(#chartGradientSmall)"
                                                    className="opacity-20"
                                                />
                                                <defs>
                                                    <linearGradient id="chartGradientSmall" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#22c55e" />
                                                        <stop offset="100%" stopColor="transparent" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="border-t border-border/50 py-2">
                                        <div className="flex w-full justify-between text-muted-foreground">
                                            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 hover:text-red-500" aria-label="Like post">
                                                <Heart className="w-3.5 h-3.5" /> <span className="text-[10px]">245</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 hover:text-blue-500" aria-label="Comment on post">
                                                <MessageCircle className="w-3.5 h-3.5" /> <span className="text-[10px]">42</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 hover:text-green-500" aria-label="Share post">
                                                <Repeat2 className="w-3.5 h-3.5" /> <span className="text-[10px]">12</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 hover:text-primary" aria-label="Save post">
                                                <Bookmark className="w-3.5 h-3.5" /> <span className="text-[10px]">Save</span>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: Chat Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex-1"
                    >
                        <div className="h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-primary/20 transition-colors">
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl -z-10 translate-z-0" />

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-6 h-6 text-primary" /> Premium Chat
                                </h3>
                                <p className="text-muted-foreground">
                                    Direct access to experts. Discuss strategies, ask questions, and grow with the community.
                                </p>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <Card className="w-full max-w-xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden flex flex-row p-0 gap-0 h-[350px] transform group-hover:scale-[1.02] transition-transform duration-500">

                                    {/* Sidebar (Chat List) */}
                                    <div className="w-1/3 border-r border-border/50 bg-muted/20 flex flex-col">
                                        <div className="p-3 border-b border-border/50">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1.5 w-3 h-3 text-muted-foreground" />
                                                <input className="w-full bg-background/50 border border-border/50 rounded-md py-1 pl-6 pr-2 text-[10px] outline-none" placeholder="Search..." aria-label="Search chats" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {[
                                                { name: "Subscription Group", msg: "AK: Watch 26,200...", time: "2m", active: true, avatar: "SG", color: "bg-primary" },
                                                { name: "Crypto Whales", msg: "BTC pumping! 🚀", time: "5m", active: false, avatar: "CW", color: "bg-orange-500" },
                                                { name: "Arif Md Khan", msg: "Hey", time: "1h", active: false, avatar: "AK", color: "bg-blue-500" },
                                                { name: "Support", msg: "Ticket #1234 resolved", time: "2h", active: false, avatar: "SP", color: "bg-green-500" },
                                            ].map((chat, i) => (
                                                <div key={i} className={`p-3 flex gap-2 items-center cursor-pointer hover:bg-muted/50 transition-colors ${chat.active ? 'bg-muted/50 border-l-2 border-primary' : ''}`}>
                                                    <Avatar className="w-8 h-8 shrink-0">
                                                        <AvatarFallback className={`${chat.color} text-primary-foreground text-[9px]`}>{chat.avatar}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="overflow-hidden">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-[10px] truncate">{chat.name}</span>
                                                            <span className="text-[8px] text-muted-foreground shrink-0">{chat.time}</span>
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground truncate">{chat.msg}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Chat Window */}
                                    <div className="flex-1 flex flex-col bg-background/50">
                                        {/* Header */}
                                        <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">SG</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col gap-1">

                                                    {/* Row 1: Text + Badge */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-xs">Subscription Group</div>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] h-4 px-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-medium border-yellow-500/20 flex items-center gap-1"
                                                        >
                                                            <Crown className="w-2.5 h-2.5 fill-current" />
                                                            Premium
                                                        </Badge>
                                                    </div>

                                                    {/* Row 2: Icon + Number */}
                                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                        <Crown className="w-3 h-3 text-yellow-500 fill-current" />
                                                        <span>87 members</span>
                                                    </div>

                                                </div>
                                            </div>
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 p-3 space-y-3 overflow-hidden bg-linear-to-b from-background to-muted/10 relative">
                                            <div className="flex gap-2">
                                                <Avatar className="w-6 h-6 mt-1">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-[9px]">AK</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-muted/50 p-2 rounded-xl rounded-tl-none text-xs max-w-[85%]">
                                                    <p>Watch 26,200 levels.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-row-reverse">
                                                <Avatar className="w-6 h-6 mt-1">
                                                    <AvatarFallback className="bg-orange-500/10 text-orange-500 text-[9px]">JD</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-primary text-primary-foreground p-2 rounded-xl rounded-tr-none text-xs max-w-[85%]">
                                                    <p>Copy that! Entered long.</p>
                                                </div>
                                            </div>

                                            {/* Typing */}
                                            <div className="absolute bottom-2 left-3 flex gap-1 items-center bg-background/80 px-2 py-1 rounded-full border border-border/50">
                                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce delay-75" />
                                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce delay-150" />
                                            </div>
                                        </div>

                                        {/* Input */}
                                        <div className="p-2 border-t border-border/50 bg-background">
                                            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/30">
                                                <input className="flex-1 bg-transparent text-xs px-2 outline-none" placeholder="Type a message..." readOnly aria-label="Type a message" />
                                                <Send className="w-3 h-3 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
