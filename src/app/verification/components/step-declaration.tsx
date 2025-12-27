"use client";

import { VerificationFormData } from "../page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { saveApplicationDraft, submitApplication } from "@/server/actions/verification.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepProps {
    data: VerificationFormData;
    updateData: (data: Partial<VerificationFormData>) => void;
    onBack: () => void;
    onSubmitSuccess: (applicationId: string) => void;
}

export function StepDeclaration({ data, updateData, onBack, onSubmitSuccess }: StepProps) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!data.hasAgreedToTerms) {
            toast.error("You must agree to the declarations to proceed.");
            return;
        }

        setSubmitting(true);
        // 1. Final Save Draft to ensure latest state is in DB
        const saveRes = await saveApplicationDraft({
            ...data,
            isSebiRegistered: data.isSebiRegistered ?? undefined,
            hasCertifications: data.hasCertifications ?? undefined,
        });

        if (saveRes.status === "error" || !saveRes.data?.applicationId) {
            setSubmitting(false);
            toast.error(saveRes.message || "Failed to save application data.");
            return;
        }

        const appId = saveRes.data.applicationId;

        // 2. Submit Action
        const submitRes = await submitApplication(appId);
        setSubmitting(false);

        if (submitRes.status === "success") {
            toast.success("Application submitted successfully!");
            onSubmitSuccess(appId);
        } else {
            toast.error(submitRes.message || "Submission failed. Please check for errors.");
        }
    };

    return (
        <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Final Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">

                <div className="rounded-md border border-border bg-muted/30 p-6 space-y-4">
                    <h4 className="font-semibold text-foreground">Please confirm the following:</h4>

                    <div className="items-top flex space-x-2">
                        <Checkbox id="d1" checked={data.hasAgreedToTerms} onCheckedChange={(c) => updateData({ hasAgreedToTerms: !!c })} />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="d1" className="text-sm font-medium leading-normal cursor-pointer text-muted-foreground">
                                I declare that all information submitted is accurate and verifiable. I understand that false information can lead to immediate rejection and permanent ban from Expert status.
                                I consent to background checks regarding my SEBI status and P&L claims.
                            </Label>
                        </div>
                    </div>

                    {data.brokerPnls.length > 0 && (
                        <div className="items-top flex space-x-2">
                            <Checkbox id="d2" disabled checked={true} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="d2" className="text-sm font-medium leading-normal text-muted-foreground">
                                    I verify that the submitted P&L links represent my true trading performance and exclude Mutual Funds.
                                </Label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={onBack} disabled={submitting}>Back</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !data.hasAgreedToTerms} className="bg-primary hover:bg-primary/90 text-primary-foreground w-40">
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Submit Application
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
