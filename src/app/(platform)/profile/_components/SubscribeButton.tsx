"use client";

import { Button } from "@/components/ui/button";
import { checkSubscription } from "@/features/subscriptions/actions/check-subscription.action";
import { subscribeAction } from "@/features/subscriptions/actions/subscribe.action";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface SubscribeButtonProps {
    creatorId: string;
    price: number;
}

export function SubscribeButton({ creatorId, price }: SubscribeButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"PENDING" | "ACTIVE" | "CANCELLED" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await checkSubscription(creatorId);
                if (res.status === "success") {
                    setStatus(res.data as "PENDING" | "ACTIVE" | "CANCELLED" | null);
                }
            } catch (error) {
                console.error("Failed to fetch subscription status", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStatus();
    }, [creatorId]);

    function onSubscribe() {
        startTransition(async () => {
            const res = await subscribeAction(creatorId);
            if (res && res.status === "error") {
                toast.error(res.message);
            }
           
        });
    }

    if (isLoading) {
        return (
            <Button disabled variant="outline" size="sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
            </Button>
        );
    }

    if (status === "ACTIVE") {
        return (
            <Button disabled variant="secondary" size="sm">
                <Sparkles className="mr-2 h-4 w-4 fill-primary text-primary" />
                Subscribed
            </Button>
        );
    }

    if (status === "PENDING") {
        return (
            <Button onClick={onSubscribe} disabled={isPending} variant="outline" size="sm">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Payment
            </Button>
        );
    }

    return (
        <Button onClick={onSubscribe} disabled={isPending} size="sm" className="bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0">
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Subscribe for ₹{price}/mo
        </Button>
    );
}
