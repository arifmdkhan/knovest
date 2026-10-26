"use client";

import { useEffect, useState, use } from "react";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { LivestreamPlayer } from "../_components/LivestreamPlayer";
import { loadRoomCall } from "@/lib/load-room-call";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/components/NavigationProvider";
import { toast } from "sonner";
import { useChatContext } from "stream-chat-react";
import { useTradeRoomContext } from "../_components/TradeRoomContext";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CustomCallData } from "@/types/stream";
import { hasUserPaidForStream } from "@/features/media/actions/check-stream-access.action";

interface StreamPageProps {
    params: Promise<{ streamId: string }>;
}

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
            } catch (error: unknown) {
                if (error instanceof Error && ((error as any).code === 17 || error.message?.includes("JoinBackstage"))) {
                    console.log("Stream is backstage. Waiting.");
                    if (isMounted) setIsJoined(true); // Treat as joined for UI purposes
                } else {
                    console.error("Failed to join call", error);
                    toast.error(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    }, [call]); 

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
            if (call && call.id === streamId) {
                if (isChecking) setIsChecking(false);
                return;
            }

            const callObj = client.call("livestream", streamId);

            try {
                await loadRoomCall(callObj);
                if (callObj.state.endedAt) {
                    toast.info("This stream has ended.");
                    router.push("/trade-room");
                    return;
                }

                if (!isMounted) return;

                const customData = (callObj.state.custom || {}) as CustomCallData;
                const currentUserId = session.user.id;
                const streamUserId = chatClient.userID;
                const creatorId = callObj.state.createdBy?.id;

                // Creator always has access
                const isCreator = (creatorId === currentUserId) || (creatorId === streamUserId);

                if (isCreator) {
                    if (isMounted && !call) setCall(callObj);
                    return;
                }

                // Regular Permissions (Group/User/Member) - CHECK FIRST
                let hasSpecificPermission = false;

                // Check if user is already a member (paid and added by backend)
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

                    if (!hasSpecificPermission && customData.allowedUserIds) {
                        let allowedIds: string[] = [];

                        if (Array.isArray(customData.allowedUserIds)) {

                            allowedIds = customData.allowedUserIds.map((id: unknown) => String(id));
                        } else if (typeof customData.allowedUserIds === 'string') {
                            try {
                                const parsed = JSON.parse(customData.allowedUserIds);
                                if (Array.isArray(parsed)) {
                                    allowedIds = parsed.map((id: unknown) => String(id));
                                }
                            } catch (e) {
                                
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

                // Paid Stream Logic :Check last (if no specific permission)
                if (customData.isPaid) {
                    const paymentCheck = await hasUserPaidForStream(streamId, currentUserId);
                    const hasPaid = paymentCheck.status === 'success' && !!paymentCheck.data;

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

                // Access Denied (neither specific permission nor paid)
                if (isMounted) {
                   
                    toast.error("Permission verification failed.");
                    router.push('/trade-room');
                }
                return;

                // if (isMounted && !call) {
                //     setCall(callObj);
                // }

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
        <div className="h-full min-h-0 w-full overflow-hidden">
            <StreamConnectionWrapper key={call.id} call={call} />
        </div>
    );
}
