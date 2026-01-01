"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { getSubscriptionStatus } from "@/features/subscriptions/actions/get-subscription-status.action";
import { cancelSubscription } from "@/features/subscriptions/actions/cancel-subscription.action";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Subscription {
    id: string;
    subscribedTo: {
        id: string;
        name: string;
        username: string | null;
        image: string | null;
        expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
        accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
    };
}

interface ManageSubscriptionsProps {
    subscriptions: Subscription[];
}

export function ManageSubscriptions({ subscriptions }: ManageSubscriptionsProps) {
    const [isPending, startTransition] = useTransition();
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const handleCancel = (subscriptionId: string) => {
        setCancellingId(subscriptionId);
        startTransition(async () => {
            const res = await cancelSubscription(subscriptionId);
            if (res.status === "success") {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
            setCancellingId(null);
        });
    };

    if (subscriptions.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Subscriptions</CardTitle>
                <CardDescription>
                    View and manage your active subscriptions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                        <UserAvatarWithInfo
                            name={sub.subscribedTo.name}
                            username={sub.subscribedTo.username}
                            image={sub.subscribedTo.image}
                            expertVerificationType={sub.subscribedTo.expertVerificationType}
                            accountVerificationType={sub.subscribedTo.accountVerificationType}
                        />

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isPending && cancellingId === sub.id}
                                >
                                    {isPending && cancellingId === sub.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Cancel"
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to cancel your subscription to <span className="font-semibold">{sub.subscribedTo.name}</span>?
                                        You will lose access to their exclusive content immediately.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleCancel(sub.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Yes, Cancel
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
