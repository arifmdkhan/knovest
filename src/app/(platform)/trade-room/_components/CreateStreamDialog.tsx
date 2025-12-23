"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { StreamChatGenerics, CustomChannelData } from "@/lib/chat-types";
import { Channel } from "stream-chat";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { UserMultiSelect } from "@/components/UserMultiSelect";
import { ManageAccessDialog } from "./ManageAccessDialog";

interface CreateStreamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialScheduled?: boolean;
    editCall?: Call;
}

export function CreateStreamDialog({ open, onOpenChange, initialScheduled = false, editCall }: CreateStreamDialogProps) {
    const client = useStreamVideoClient();
    const { client: chatClient } = useChatContext();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [permissionType, setPermissionType] = useState<"everyone" | "group">("everyone");
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | "">("");
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [myGroups, setMyGroups] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingGroups, setIsFetchingGroups] = useState(false);
    const [isScheduled, setIsScheduled] = useState(initialScheduled);
    const [scheduledTime, setScheduledTime] = useState<Date | undefined>();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [showManageAccess, setShowManageAccess] = useState(false);

    useEffect(() => {
        if (open) {
            if (editCall) {
                const custom = (editCall.state.custom || {}) as any;
                setTitle(custom.title || "");
                setDescription(custom.description || "");
                setPermissionType(custom.permissionType || "everyone");
                setSelectedGroups(custom.allowedGroups || []);
                setSelectedUserIds(custom.allowedUserIds || []);
                setIsPaid(!!custom.isPaid);
                setPrice(custom.price || "");
                setIsScheduled(!!editCall.state.startsAt);
                setScheduledTime(editCall.state.startsAt ? new Date(editCall.state.startsAt) : undefined);
            } else {
                setTitle("");
                setDescription("");
                setPermissionType("everyone");
                setSelectedGroups([]);
                setSelectedUserIds([]);
                setIsPaid(false);
                setPrice("");
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

    const handleCreateStream = async () => {
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

        if (isPaid && (!price || Number(price) <= 0)) {
            toast.error("Please enter a valid price for the access pass");
            return;
        }

        setIsLoading(true);
        try {
            // Prepare custom data with permissions
            const customData: any = {
                title,
                description,
                permissionType,
            };

            if (permissionType === "group") {
                customData.allowedGroups = selectedGroups;
                customData.allowedUserIds = selectedUserIds;

                if (isPaid) {
                    customData.isPaid = true;
                    customData.price = Number(price);
                }
            }

            const starts_at = isScheduled && scheduledTime ? scheduledTime.toISOString() : undefined;

            if (editCall) {
                await editCall.update({
                    starts_at,
                    custom: customData,
                });
                toast.success("Stream updated successfully");
            } else {
                const callId = crypto.randomUUID();
                const call = client.call("livestream", callId);

                // Ensure we have a valid token/user connection before creating
                await call.getOrCreate({
                    data: {
                        starts_at,
                        custom: customData,
                    },
                });
                toast.success(isScheduled ? "Stream scheduled successfully" : "Stream started successfully");

                if (!isScheduled) {
                    router.push(`/trade-room/${callId}`);
                }
            }

            onOpenChange(false);

        } catch (error: any) {
            console.error("Failed to save stream", error);
            if (error.message?.includes("User token is not set")) {
                toast.error("Connection lost. Please refresh the page.");
            } else {
                toast.error("Failed to save stream: " + (error.message || "Unknown error"));
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
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editCall ? "Edit Stream Details" : "Create Live Stream"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Stream Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Morning Market Analysis"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What will you be discussing?"
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
                                    <Label htmlFor="group">Specific Groups & Users</Label>
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
                            <div className="space-y-4 border rounded-md p-3 bg-zinc-50 dark:bg-zinc-900/50">
                                {/* User Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Select Users</Label>
                                        {editCall && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-violet-400 hover:text-violet-300 px-2"
                                                onClick={() => setShowManageAccess(true)}
                                                type="button"
                                            >
                                                Manage Current Access
                                            </Button>
                                        )}
                                    </div>
                                    <UserMultiSelect
                                        selectedUserIds={selectedUserIds}
                                        onSelectedUserIdsChange={setSelectedUserIds}
                                    />
                                </div>

                                {/* Group Selection */}
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <Label className="mb-2 block">Select Groups</Label>
                                    <div className="max-h-[150px] overflow-y-auto">
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

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="paid-access">Enable Paid Access Pass</Label>
                                        <p className="text-xs text-muted-foreground">Allow others to pay to join this stream (15 min window)</p>
                                    </div>
                                    <Switch
                                        id="paid-access"
                                        checked={isPaid}
                                        onCheckedChange={setIsPaid}
                                    />
                                </div>

                                {isPaid && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <Label htmlFor="price">Access Pass Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="1"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleCreateStream} disabled={isLoading || !title}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editCall ? "Update Stream" : (isScheduled ? "Schedule Stream" : "Start Stream")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editCall && (
                <ManageAccessDialog
                    open={showManageAccess}
                    onOpenChange={setShowManageAccess}
                    call={editCall}
                />
            )}
        </>
    );
}
