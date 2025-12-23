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
import { hasUserPaidForStream } from "@/server/actions/payment-check";

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
                    toast.error(`Connection failed: ${error.message || "Unknown error"}`);
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

    const [call, setCall] = useState<Call | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!client || !chatClient || !streamId || isLoadingGroups || !session) return;

        let isMounted = true;

        const verifyPermission = async () => {
            // Optimization: If we already have a call object for this stream, we don't need to verify again.
            // This prevents race conditions where re-renders trigger redundant checks that might fail or redirect.
            if (call && call.id === streamId) {
                if (isChecking) setIsChecking(false);
                return;
            }

            const callObj = client.call("livestream", streamId);

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

                if (isCreator) {
                    if (isMounted && !call) setCall(callObj);
                    return;
                }

                // 2. Regular Permissions (Group/User/Member) - CHECK FIRST
                let hasSpecificPermission = false;

                // NEW: Check if user is already a member (e.g. paid and added by backend)
                const isMember = callObj.state.members.some(m => m.user_id === currentUserId);
                if (isMember) {
                    hasSpecificPermission = true;
                }

                if (!hasSpecificPermission && customData?.permissionType === "group") {
                    // Check Groups
                    if (customData.allowedGroups && Array.isArray(customData.allowedGroups)) {
                        if (customData.allowedGroups.some(groupId => myGroupIds.includes(groupId))) {
                            hasSpecificPermission = true;
                        }
                    }

                    // Check Users Logic - Unified safe parsing
                    if (!hasSpecificPermission && customData.allowedUserIds) {
                        let allowedIds: string[] = [];

                        // Handle potential formats
                        if (Array.isArray(customData.allowedUserIds)) {
                            // Map to strings to be safe
                            allowedIds = customData.allowedUserIds.map((id: any) => String(id));
                        } else if (typeof customData.allowedUserIds === 'string') {
                            try {
                                const parsed = JSON.parse(customData.allowedUserIds);
                                if (Array.isArray(parsed)) {
                                    allowedIds = parsed.map((id: any) => String(id));
                                }
                            } catch (e) {
                                // Maybe comma separated?
                                allowedIds = [customData.allowedUserIds];
                            }
                        }

                        if (allowedIds.length > 0) {
                            hasSpecificPermission = allowedIds.some(id => {
                                const strId = id.trim();
                                return (currentUserId && strId === String(currentUserId).trim()) ||
                                    (streamUserId && strId === String(streamUserId).trim());
                            });
                        }
                    }
                } else if (!hasSpecificPermission && (!customData.permissionType || customData.permissionType === 'everyone')) {
                    if (!customData.isPaid) hasSpecificPermission = true;
                }

                if (hasSpecificPermission) {
                    if (isMounted && !call) setCall(callObj);
                    return;
                }

                // 3. Paid Stream Logic - CHECK LAST (if no specific permission)
                if (customData.isPaid) {
                    const hasPaid = await hasUserPaidForStream(streamId, currentUserId);

                    if (hasPaid) {
                        if (isMounted && !call) setCall(callObj);
                        return;
                    } else {
                        // Check 15 min window
                        const startTime = callObj.state.startsAt ? new Date(callObj.state.startsAt).getTime() :
                            (callObj.state.startedAt ? new Date(callObj.state.startedAt).getTime() :
                                (callObj.state.createdAt ? new Date(callObj.state.createdAt).getTime() : Date.now()));
                        const timeDiff = Date.now() - startTime;
                        const isWindowOpen = (timeDiff <= 15 * 60 * 1000 || timeDiff < 0);

                        if (isWindowOpen) {
                            if (isMounted) {
                                router.push(`/trade-room/payment/${streamId}`);
                            }
                            return;
                        } else {
                            if (isMounted) {
                                toast.error("Paid access for this stream is currently closed.");
                                router.push('/trade-room');
                            }
                            return;
                        }
                    }
                }

                // 4. Access Denied (neither specific permission nor paid)
                if (isMounted) {
                    // Only show toast if we are sure we are denied
                    toast.error("Permission verification failed.");
                    router.push('/trade-room');
                }
                return;

                if (isMounted && !call) {
                    setCall(callObj);
                }

            } catch (error) {
                console.error("Failed to load stream or verify permissions", error);
                if (isMounted && !call) {
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
                <p className="text-muted-foreground">Stream not found, failed to load, or access denied.</p>
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
