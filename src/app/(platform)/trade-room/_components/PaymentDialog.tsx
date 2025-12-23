"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { purchaseStreamAccess } from "@/server/actions/stream-access";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    streamId: string;
    streamTitle: string;
    price: number;
    onSuccess: () => void;
}

export function PaymentDialog({ open, onOpenChange, streamId, streamTitle, price, onSuccess }: PaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // In a real app, this would trigger a payment gateway
            const result = await purchaseStreamAccess(streamId, price);

            if (result.success) {
                toast.success("Access pass purchased successfully!");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Payment failed");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Purchase Access Pass</DialogTitle>
                    <DialogDescription>
                        This is a restricted stream. Purchase an access pass to join.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 border border-zinc-200 dark:border-zinc-800">
                    <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>

                    <div className="text-center space-y-1">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{streamTitle}</h3>
                        <p className="text-sm text-zinc-500">One-time access pass</p>
                    </div>

                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{price}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        Pay & Join
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
