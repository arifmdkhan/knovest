"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { confirmEnrollment } from "@/server/actions/academy/confirm-enrollment";

function PaymentContent() {
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const enrollmentId = searchParams.get("enrollmentId");

    const handlePayment = async () => {
        if (!enrollmentId) {
            toast.error("Invalid enrollment ID");
            return;
        }

        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            const res = await confirmEnrollment(enrollmentId);
            
            if (res.status === "success") {
                toast.success("Payment successful! You are now enrolled.");
                 router.push("/academy/enrolled");  // Or redirect to the course page if we had the slug
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!enrollmentId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-destructive">Invalid Payment Link</p>
            </div>
        );
    }

    return (
        <div className="container flex items-center justify-center min-h-screen py-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Complete Enrollment</CardTitle>
                    <CardDescription>
                        Confirm your payment to enroll in this course.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Secure Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        You are about to purchase this course. This will charge your payment method.
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

export default function AcademyPaymentPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <PaymentContent />
        </Suspense>
    );
}
