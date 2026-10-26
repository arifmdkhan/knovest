"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Clock } from "lucide-react";
import { useRouter } from "@/components/NavigationProvider";

interface StepProps {
    status: "PENDING" | "REJECTED";
    applicationId?: string;
}

export function StepSubmission({ status, applicationId }: StepProps) {
    const router = useRouter();

    const formattedId = applicationId ? `C${applicationId.slice(-11).toUpperCase()}` : "PENDING";

    if (status === "REJECTED") {
        return (
            <div className="container max-w-xl py-20 mx-auto">
                <Card className="border-destructive/20 bg-destructive/5 p-10 text-center space-y-6">
                    <div className="flex justify-center">
                        <XCircle className="w-16 h-16 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold text-destructive">Application Rejected</h2>
                    <p className="text-muted-foreground">
                        Unfortunately, your application did not meet our core eligibility criteria at this time.
                    </p>
                    <div className="p-4 bg-background/50 rounded-lg text-sm text-foreground border border-border/50 max-w-xs mx-auto">
                        Application ID: <span className="font-mono font-bold">{formattedId}</span>
                    </div>
                    <div className="pt-4">
                        <Button variant="outline" onClick={() => router.push("/home")}>Return to Home Page</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-xl py-20 mx-auto">
            <Card className="border-border bg-card/80 p-10 text-center space-y-6 animate-in zoom-in-95 backdrop-blur-sm">
                <div className="flex justify-center">
                    <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Application Under Review</h2>
                <p className="text-muted-foreground text-lg">
                    Thank you for applying. Our team is currently reviewing your details.
                    This manual process typically takes <strong>2-3 business days</strong>.
                </p>
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-foreground max-w-xs mx-auto">
                    Application ID: <span className="font-mono font-bold">{formattedId}</span>
                </div>
                <div className="pt-6">
                    <Button onClick={() => router.push("/home")} variant="secondary" className="w-full">
                        Return to Home Page
                    </Button>
                </div>
            </Card>
        </div>
    );
}
