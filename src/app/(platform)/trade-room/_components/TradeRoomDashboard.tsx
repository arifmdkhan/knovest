"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Calendar, Radio, Mic, Headphones } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import dynamic from "next/dynamic";
import { StreamList } from "./StreamList";
import { AudioRoomList } from "./AudioRoomList";

const CreateStreamDialog = dynamic(() => import("./CreateStreamDialog").then(mod => mod.CreateStreamDialog), {
    ssr: false
});
const CreateAudioRoomDialog = dynamic(() => import("./CreateAudioRoomDialog").then(mod => mod.CreateAudioRoomDialog), {
    ssr: false
});
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/generated/prisma/client";
import { PremiumBackground } from "../../chat/_components/PremiumBackground";

interface TradeRoomDashboardProps {
    initialActiveStreams?: any[];
    initialAudioRooms?: any[];
}

export default function TradeRoomDashboard({ initialActiveStreams, initialAudioRooms }: TradeRoomDashboardProps) {
    const { data: session } = authClient.useSession();
    const [showCreateStream, setShowCreateStream] = useState(false);
    const [showCreateAudioRoom, setShowCreateAudioRoom] = useState(false);
    const [isScheduleMode, setIsScheduleMode] = useState(false);

    // Check if user is verified
    const isVerified = (session?.user as User)?.isVerified;

    const handleOpenCreateStream = (schedule: boolean) => {
        setIsScheduleMode(schedule);
        setShowCreateStream(true);
    };

    const handleOpenCreateAudioRoom = (schedule: boolean) => {
        setIsScheduleMode(schedule);
        setShowCreateAudioRoom(true);
    };

    return (
        <PremiumBackground className="h-full w-full">
            <div className="flex flex-col p-4 md:p-6 space-y-6 h-full overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trade Room</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Live trading sessions, audio discussions, and market analysis.</p>
                    </div>
                    {isVerified && (
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleOpenCreateAudioRoom(true)} className="flex-1 md:flex-none border-violet-200 hover:bg-violet-50 text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900/20 dark:text-violet-400">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Audio
                                </Button>
                                <Button onClick={() => handleOpenCreateAudioRoom(false)} className="bg-violet-600 hover:bg-violet-700 text-white flex-1 md:flex-none">
                                    <Mic className="mr-2 h-4 w-4" />
                                    Audio Room
                                </Button>
                            </div>
                            <div className="w-px h-8 bg-border hidden md:block mx-2"></div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleOpenCreateStream(true)} className="flex-1 md:flex-none">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Stream
                                </Button>
                                <Button onClick={() => handleOpenCreateStream(false)} className="bg-red-600 hover:bg-red-700 text-white flex-1 md:flex-none">
                                    <Video className="mr-2 h-4 w-4" />
                                    Stream Now
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">All Live</TabsTrigger>
                        <TabsTrigger value="audio">Audio Rooms</TabsTrigger>
                        <TabsTrigger value="video">Video Streams</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6">
                        {isVerified && (
                            <Card className="col-span-full border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/10 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>My Sessions</CardTitle>
                                    <CardDescription>Manage your active and upcoming streams and audio rooms.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-4 text-violet-600 dark:text-violet-400 flex items-center gap-2"><Mic className="w-4 h-4" /> Your Audio Rooms</h3>
                                        <AudioRoomList type="my-rooms" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2"><Video className="w-4 h-4" /> Your Video Streams</h3>
                                        <StreamList type="my-streams" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="col-span-full bg-linear-to-r from-violet-50 to-white border-violet-100 dark:from-violet-950/10 dark:to-zinc-900 dark:border-violet-900/30 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Headphones className="h-5 w-5 text-violet-500 animate-pulse" />
                                    Live Audio Rooms
                                </CardTitle>
                                <CardDescription>Join active audio discussions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AudioRoomList type="live" initialData={initialAudioRooms} />
                            </CardContent>
                        </Card>

                        <Card className="col-span-full bg-linear-to-r from-zinc-100 to-white border-zinc-200 dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-700 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                                    Live Video Streams
                                </CardTitle>
                                <CardDescription>Join active video trading sessions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StreamList type="live" initialData={initialActiveStreams} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audio" className="space-y-6">
                        <Card className="col-span-full backdrop-blur-sm bg-white/50 dark:bg-zinc-900/50">
                            <CardHeader><CardTitle>Live Audio Rooms</CardTitle></CardHeader>
                            <CardContent><AudioRoomList type="live" initialData={initialAudioRooms} /></CardContent>
                        </Card>
                        <Card className="col-span-full backdrop-blur-sm bg-white/50 dark:bg-zinc-900/50">
                            <CardHeader><CardTitle>Upcoming Audio Rooms</CardTitle></CardHeader>
                            <CardContent><AudioRoomList type="upcoming" /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="video" className="space-y-6">
                        <Card className="col-span-full backdrop-blur-sm bg-white/50 dark:bg-zinc-900/50">
                            <CardHeader><CardTitle>All Video Streams</CardTitle></CardHeader>
                            <CardContent><StreamList type="all-video" /></CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <CreateStreamDialog
                    open={showCreateStream}
                    onOpenChange={setShowCreateStream}
                    initialScheduled={isScheduleMode}
                />

                <CreateAudioRoomDialog
                    open={showCreateAudioRoom}
                    onOpenChange={setShowCreateAudioRoom}
                    initialScheduled={isScheduleMode}
                />
            </div>
        </PremiumBackground>
    );
}
