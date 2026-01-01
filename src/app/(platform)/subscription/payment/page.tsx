"use client";

import { Button } from "@/components/ui/button";
import { confirmSubscription } from "@/features/subscriptions/actions/confirm-subscription.action";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SubscriptionPaymentPage() {
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handlePayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Call confirmSubscription action
        const creatorId = new URLSearchParams(window.location.search).get("creatorId");
        if (creatorId) {
            const result = await confirmSubscription(creatorId);
            if (result.status === "success") {
                toast.success("Payment successful! Subscription active.");
                router.back();
            } else {
                toast.error(result.message);
            }
        } else {
            toast.error("Invalid payment session");
        }
        setIsProcessing(false);
    };

    return (
        <div className="container flex items-center justify-center min-h-screen py-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Complete Subscription</CardTitle>
                    <CardDescription>
                        Confirm your payment to subscribe to this creator.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Secure Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        You are about to subscribe. This will charge your payment method.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handlePayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Pay Now"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
