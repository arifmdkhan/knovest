"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mic } from "lucide-react";
import { CustomChannelData } from "@/lib/chat-types";
import { Channel } from "stream-chat";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { UserMultiSelect } from "@/components/UserMultiSelect";

interface CreateAudioRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialScheduled?: boolean;
    editCall?: Call;
}

export function CreateAudioRoomDialog({ open, onOpenChange, initialScheduled = false, editCall }: CreateAudioRoomDialogProps) {
    const client = useStreamVideoClient();
    const { client: chatClient } = useChatContext();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [permissionType, setPermissionType] = useState<"everyone" | "group">("everyone");
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [myGroups, setMyGroups] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingGroups, setIsFetchingGroups] = useState(false);
    const [isScheduled, setIsScheduled] = useState(initialScheduled);
    const [scheduledTime, setScheduledTime] = useState<Date | undefined>();

    useEffect(() => {
        if (open) {
            if (editCall) {
                const custom = editCall.state.custom || {};
                setTitle(custom.title || "");
                setDescription(custom.description || "");
                setPermissionType(custom.permissionType || "everyone");
                setPermissionType(custom.permissionType || "everyone");
                setSelectedGroups(custom.allowedGroups || []);

                let allowedIds: string[] = [];
                if (custom.allowedUserIds) {
                    if (Array.isArray(custom.allowedUserIds)) allowedIds = custom.allowedUserIds as string[];
                    else if (typeof custom.allowedUserIds === 'string') {
                        try { allowedIds = JSON.parse(custom.allowedUserIds); } catch (e) { }
                    }
                }
                setSelectedUserIds(allowedIds);

                setIsScheduled(!!editCall.state.startsAt);
                setScheduledTime(editCall.state.startsAt ? new Date(editCall.state.startsAt) : undefined);
            } else {
                setTitle("");
                setDescription("");
                setPermissionType("everyone");
                setPermissionType("everyone");
                setSelectedGroups([]);
                setSelectedUserIds([]);
                setIsScheduled(initialScheduled);
                setScheduledTime(undefined);
            }
        }
    }, [open, editCall, initialScheduled]);

    // Fetch user's groups when dialog opens
    useEffect(() => {
        if (open && chatClient) {
            const fetchGroups = async () => {
                setIsFetchingGroups(true);
                try {
                    const channels = await chatClient.queryChannels(
                        {
                            type: 'messaging',
                            created_by_id: chatClient.userID!,
                            name: { $exists: true } // Only named groups
                        },
                        { last_message_at: -1 }
                    );
                    setMyGroups(channels);
                } catch (error) {
                    console.error("Failed to fetch groups", error);
                } finally {
                    setIsFetchingGroups(false);
                }
            };
            fetchGroups();
        }
    }, [open, chatClient]);

    const handleCreateAudioRoom = async () => {
        if (!client) {
            toast.error("Stream client not initialized");
            return;
        }
        if (!title) {
            toast.error("Please enter a title");
            return;
        }

        if (isScheduled && !scheduledTime) {
            toast.error("Please select a start time");
            return;
        }

        setIsLoading(true);
        try {
            // Prepare custom data with permissions
            const customData: any = {
                title,
                description,
                permissionType,
                type: 'audio_room' // Explicit tag
            };

            if (permissionType === "group") {
                customData.allowedGroups = selectedGroups;
                customData.allowedUserIds = selectedUserIds;
            }

            const starts_at = isScheduled && scheduledTime ? scheduledTime.toISOString() : new Date().toISOString();

            if (editCall) {
                await editCall.update({
                    starts_at,
                    custom: customData,
                });
                toast.success("Audio Room updated successfully");
            } else {
                const callId = crypto.randomUUID();
                const call = client.call("audio_room", callId);

                await call.getOrCreate({
                    data: {
                        starts_at,
                        custom: customData,
                    },
                });
                toast.success(isScheduled ? "Audio Room scheduled successfully" : "Audio Room started successfully");

                if (!isScheduled) {
                    router.push(`/trade-room/audio-room/${callId}`);
                }
            }

            onOpenChange(false);

        } catch (error: any) {
            console.error("Failed to save audio room", error);
            if (error.message?.includes("User token is not set")) {
                toast.error("Connection lost. Please refresh the page.");
            } else {
                toast.error("Failed to save audio room");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-primary" />
                        {editCall ? "Edit Audio Room" : "Create Audio Room"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Room Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Weekly Market Discussion"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's the topic of discussion?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Who can join?</Label>
                        <RadioGroup value={permissionType} onValueChange={(v) => setPermissionType(v as "everyone" | "group")}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="everyone" id="everyone" />
                                <Label htmlFor="everyone">Everyone</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="group" id="group" />
                                <Label htmlFor="group">Specific Groups</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="schedule"
                            checked={isScheduled}
                            onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                        />
                        <Label htmlFor="schedule">Schedule for later</Label>
                    </div>

                    {isScheduled && (
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <DateTimePicker
                                date={scheduledTime}
                                setDate={setScheduledTime}
                            />
                        </div>
                    )}

                    {permissionType === "group" && (
                        <div className="space-y-4 border rounded-md p-3">
                            <div className="space-y-2">
                                <Label>Select Specific Users</Label>
                                <UserMultiSelect
                                    selectedUserIds={selectedUserIds}
                                    onSelectedUserIdsChange={setSelectedUserIds}
                                />
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                <Label className="mb-2 block">Select Groups</Label>
                                {isFetchingGroups ? (
                                    <div className="flex justify-center py-4"><Loader2 className="animate-spin h-4 w-4" /></div>
                                ) : myGroups.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No groups found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {myGroups.map(group => (
                                            <div key={group.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={group.id}
                                                    checked={selectedGroups.includes(group.id!)}
                                                    onCheckedChange={() => toggleGroup(group.id!)}
                                                />
                                                <Label htmlFor={group.id} className="cursor-pointer">{(group.data as CustomChannelData)?.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreateAudioRoom} disabled={isLoading || !title}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editCall ? "Update Room" : (isScheduled ? "Schedule Room" : "Start Room")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
