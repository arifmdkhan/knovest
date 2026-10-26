"use client";

import { useState } from "react";
import { Call } from "@stream-io/video-react-sdk";
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
import { AppHero } from "@/components/AppHero";

interface TradeRoomDashboardProps {
    initialActiveStreams?: Call[];
    initialAudioRooms?: Call[];
}

export default function TradeRoomDashboard({ initialActiveStreams, initialAudioRooms }: TradeRoomDashboardProps) {
    const { data: session } = authClient.useSession();
    const [showCreateStream, setShowCreateStream] = useState(false);
    const [showCreateAudioRoom, setShowCreateAudioRoom] = useState(false);
    const [isScheduleMode, setIsScheduleMode] = useState(false);

    // Check if user is verified (Expert) or Admin
    const userRole = (session?.user as any)?.role;
    const isExpert = !!(session?.user as any)?.expertVerificationType;
    const canHost = isExpert || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    const handleOpenCreateStream = (schedule: boolean) => {
        setIsScheduleMode(schedule);
        setShowCreateStream(true);
    };

    const handleOpenCreateAudioRoom = (schedule: boolean) => {
        setIsScheduleMode(schedule);
        setShowCreateAudioRoom(true);
    };

    return (
        <div className="w-full">
            <div className="flex flex-col space-y-6">
                <AppHero title={<>Trade <span className="text-primary">Room</span></>} description="Join live sessions, share perspectives, and stay connected to the markets.">
                    {canHost && (
                        <div className="mt-6 flex flex-wrap gap-3">
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => handleOpenCreateAudioRoom(true)} className="min-h-11">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Audio
                                </Button>
                                <Button onClick={() => handleOpenCreateAudioRoom(false)} className="min-h-11">
                                    <Mic className="mr-2 h-4 w-4" />
                                    Audio Room
                                </Button>
                            </div>
                            <div className="w-px h-8 bg-border hidden md:block mx-2"></div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => handleOpenCreateStream(true)} className="flex-1 md:flex-none">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Stream
                                </Button>
                                <Button onClick={() => handleOpenCreateStream(false)} className="min-h-11">
                                    <Video className="mr-2 h-4 w-4" />
                                    Stream Now
                                </Button>
                            </div>
                        </div>
                    )}
                </AppHero>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">All Live</TabsTrigger>
                        <TabsTrigger value="audio">Audio Rooms</TabsTrigger>
                        <TabsTrigger value="video">Video Streams</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6">
                        {canHost && (
                            <Card className="col-span-full">
                                <CardHeader>
                                    <CardTitle>My Sessions</CardTitle>
                                    <CardDescription>Manage your active and upcoming streams and audio rooms.</CardDescription>
                                </CardHeader>
                                <CardContent className="my-sessions-grid grid gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-4 text-primary flex items-center gap-2"><Video className="w-4 h-4" /> Your Video Streams</h3>
                                        <StreamList type="my-streams" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold mb-4 text-primary flex items-center gap-2"><Mic className="w-4 h-4" /> Your Audio Rooms</h3>
                                        <AudioRoomList type="my-rooms" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Radio className="h-5 w-5 text-primary" />
                                    Live Video Streams
                                </CardTitle>
                                <CardDescription>Join active video trading sessions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StreamList type="live" initialData={initialActiveStreams} />
                            </CardContent>
                        </Card>

                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Headphones className="h-5 w-5 text-primary" />
                                    Live Audio Rooms
                                </CardTitle>
                                <CardDescription>Join active audio discussions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AudioRoomList type="live" initialData={initialAudioRooms} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audio" className="space-y-6">
                        <Card className="col-span-full">
                            <CardHeader><CardTitle>Live Audio Rooms</CardTitle></CardHeader>
                            <CardContent><AudioRoomList type="live" initialData={initialAudioRooms} /></CardContent>
                        </Card>
                        <Card className="col-span-full">
                            <CardHeader><CardTitle>Upcoming Audio Rooms</CardTitle></CardHeader>
                            <CardContent><AudioRoomList type="upcoming" /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="video" className="space-y-6">
                        <Card className="col-span-full">
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
        </div>
    );
}
