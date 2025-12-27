"use client";

import { useEffect, useState, use } from "react";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { purchaseStreamAccess } from "@/server/actions/stream-access";
import { CustomCallData } from "@/types/stream";

interface PaymentPageProps {
    params: Promise<{ streamId: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
    const { streamId } = use(params);
    const client = useStreamVideoClient();
    const router = useRouter();

    const [call, setCall] = useState<Call | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!client || !streamId) return;

        const loadStream = async () => {
            try {
                const callObj = client.call("livestream", streamId);
                await callObj.get();
                setCall(callObj);
            } catch (error) {
                console.error("Failed to load stream details", error);
                toast.error("Failed to load stream details");
            } finally {
                setIsLoading(false);
            }
        };

        loadStream();
    }, [client, streamId]);

    const handlePayment = async () => {
        if (!call) return;
        const customData = (call.state.custom || {}) as CustomCallData;
        const price = customData.price ? Number(customData.price) : 0;

        try {
            setIsProcessing(true);
            const result = await purchaseStreamAccess(streamId, price);

            if (result.status === "success") {
                toast.success("Payment Successful! Access granted.");
                // Force a hard navigation back to the stream page to ensure fresh state
                window.location.href = `/trade-room/${streamId}`;
            } else {
                toast.error(result.message || "Payment failed");
            }
        } catch (error) {
            console.error("Payment error", error);
            toast.error("An unexpected error occurred during payment");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!call) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Stream Not Found</h1>
                    <Button onClick={() => router.push('/trade-room')}>Go Back</Button>
                </div>
            </div>
        );
    }

    const customData = (call.state.custom || {}) as CustomCallData;
    const price = customData.price ? Number(customData.price) : 0;
    const title = customData.title || "Restricted Stream";

    return (
        <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-2xl border-zinc-200 dark:border-zinc-800">
                <CardHeader className="text-center space-y-2 pb-6">
                    <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
                        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        This stream requires a paid access pass.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-xl text-center border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Pass Price</p>
                        <p className="text-4xl font-extrabold text-foreground">₹{price}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Instant access to live stream</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Participate in chat & discussions</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
                        onClick={handlePayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay ₹{price} & Join
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
