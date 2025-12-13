"use client";

import { useEffect, useState, use, useRef } from "react";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { LivestreamPlayer } from "../_components/LivestreamPlayer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChatContext } from "stream-chat-react";
import { useTradeRoomContext } from "../_components/TradeRoomContext";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CustomCallData } from "@/types/stream";

interface StreamPageProps {
    params: Promise<{ streamId: string }>;
}

// Separate component to handle connection lifecycle strictly
// This ensures that re-renders or permission re-checks in the parent don't trigger a rejoin
function StreamConnectionWrapper({ call }: { call: Call }) {
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const connect = async () => {
            console.log("StreamConnectionWrapper: Connecting...");
            try {
                // Ensure devices are disabled by default
                await call.camera.disable();
                await call.microphone.disable();

                if (isMounted) {
                    await call.join();
                    setIsJoined(true);
                    console.log("StreamConnectionWrapper: Joined successfully");
                }
            } catch (error: any) {
                if (error.code == 17 || error.message?.includes("JoinBackstage")) {
                    console.log("Stream is backstage. Waiting.");
                    if (isMounted) setIsJoined(true); // Treat as joined for UI purposes
                } else {
                    console.error("Failed to join call", error);
                    toast.error("Failed to join stream");
                }
            }
        };

        const currentCall = call;
        connect();

        return () => {
            isMounted = false;
            console.log("StreamConnectionWrapper: Cleanup - Leaving call");
            currentCall.leave().catch(e => console.error("Error leaving call", e));
        };
    }, [call]); // Only re-run if the call object reference changes (which it shouldn't once set)

    if (!isJoined) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return <LivestreamPlayer call={call} />;
}

export default function StreamPage({ params }: StreamPageProps) {
    const { streamId } = use(params);
    const client = useStreamVideoClient();
    const { client: chatClient } = useChatContext();
    const { data: session } = authClient.useSession();
    const { myGroupIds, isLoadingGroups } = useTradeRoomContext();
    const router = useRouter();

    // We hold the stable call object here. Once set, it doesn't change unless streamId changes.
    const [call, setCall] = useState<Call | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!client || !chatClient || !streamId || isLoadingGroups || !session) return;

        let isMounted = true;

        const verifyPermission = async () => {
            // If we already have a call object, we reuse it to check permissions
            // This prevents creating new "client.call()" instances which might look like new connections
            // logic: If call state is null, we create new. If not null, we verify existing.

            // Note: client.call() is lightweight, but we want to avoid replacing the 'call' state if it's already set.

            const callObj = call || client.call("livestream", streamId);

            try {
                // Refresh state to get latest custom data/permissions
                await callObj.get();

                if (!isMounted) return;

                const customData = (callObj.state.custom || {}) as CustomCallData;
                const currentUserId = session.user.id;
                const streamUserId = chatClient.userID;
                const creatorId = (callObj.state.createdBy as any)?.id;

                // 1. Creator always has access
                const isCreator = (creatorId === currentUserId) || (creatorId === streamUserId);

                if (!isCreator) {
                    // 2. Check Permissions
                    if (customData?.permissionType === "group") {
                        let hasPermission = false;

                        // Check Groups
                        if (customData.allowedGroups && customData.allowedGroups.length > 0) {
                            if (customData.allowedGroups.some(groupId => myGroupIds.includes(groupId))) {
                                hasPermission = true;
                            }
                        }

                        // Check Users
                        if (!hasPermission && customData.allowedUserIds) {
                            let allowedIds: any[] = [];
                            if (Array.isArray(customData.allowedUserIds)) {
                                allowedIds = customData.allowedUserIds;
                            } else if (typeof customData.allowedUserIds === 'string') {
                                try { allowedIds = JSON.parse(customData.allowedUserIds); } catch (e) { }
                            }

                            if (Array.isArray(allowedIds)) {
                                hasPermission = allowedIds.some((id: any) => {
                                    const strId = String(id).trim();
                                    return (currentUserId && strId === String(currentUserId).trim()) ||
                                        (streamUserId && strId === String(streamUserId).trim());
                                });
                            }
                        }

                        if (!hasPermission) {
                            if (isMounted) {
                                toast.error("You do not have permission to join this stream.");
                                router.push('/trade-room');
                            }
                            return;
                        }
                    }
                }

                // Permission Verified.

                // Only set call if it wasn't set before. 
                // This ensures 'call' reference stability for the child component.
                if (isMounted && !call) {
                    setCall(callObj);
                }

            } catch (error) {
                console.error("Failed to load stream or verify permissions", error);
                if (isMounted && !call) { // Only redirect if we haven't successfully loaded it before
                    toast.error("Stream not found or failed to load");
                    router.push('/trade-room');
                }
            } finally {
                if (isMounted) setIsChecking(false);
            }
        };

        verifyPermission();

        return () => { isMounted = false; };
    }, [client, chatClient, streamId, router, myGroupIds, isLoadingGroups, session, call]);

    if (isChecking && !call) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!call) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <p className="text-muted-foreground">Stream not found or failed to load.</p>
                <Button onClick={() => router.push('/trade-room')}>Go Back</Button>
            </div>
        );
    }

    // Render the wrapper which handles the stable connection
    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-black">
            <StreamConnectionWrapper key={call.id} call={call} />
        </div>
    );
}
