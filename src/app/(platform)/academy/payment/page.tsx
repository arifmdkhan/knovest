"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/components/NavigationProvider";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { confirmEnrollment } from "@/features/courses/actions/confirm-enrollment";

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

        try {
            const res = await confirmEnrollment(enrollmentId);

            if (res.status === "success") {
                toast.success("Enrollment confirmed.");
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
                        Confirm your enrollment. Paid checkout is not available yet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Confirm access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Free enrollment is supported. Paid checkout is not available yet.
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
                            "Confirm"
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
