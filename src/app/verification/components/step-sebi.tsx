"use client";

import { VerificationFormData } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { saveApplicationDraft } from "@/features/verification/actions/verification.action";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MediaUploader } from "@/components/handle-media/media-uploader";
import { UploadIntent } from "@/lib/storage/types";

import { cn } from "@/lib/utils";

interface StepProps {
    data: VerificationFormData;
    updateData: (data: Partial<VerificationFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    userId?: string;
}

const SEBI_TYPES = [
    "Registered Investment Adviser (RIA)",
    "Research Analyst (RA)",
    "Portfolio Manager (PMS)",
    "Mutual Fund Distributor (ARN)",
    "Alternative Investment Fund (AIF)",
    "Stock Broker (Trading Member)",
    "Other"
];

export function StepSebi({ data, updateData, onNext, onBack, userId }: StepProps) {
    const [saving, setSaving] = useState(false);

    const handleNext = async () => {
        // Validation
        if (data.isSebiRegistered === null) {
            toast.error("Please answer if you are SEBI registered.");
            return;
        }

        if (data.isSebiRegistered === true) {
            if (!data.sebiLicenseType || !data.sebiRegNumber || !data.sebiRegName || !data.sebiCertUrl) {
                toast.error("Please complete all SEBI details and upload certificate.");
                return;
            }
        }

        setSaving(true);
        const res = await saveApplicationDraft({
            ...data,
            isSebiRegistered: data.isSebiRegistered ?? undefined,
            hasCertifications: data.hasCertifications ?? undefined,
        });
        setSaving(false);

        if (res.status === "success") {
            onNext();
        } else {
            toast.error(res.message || "Failed to save progress. Try again.");
        }
    };

    return (
        <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>SEBI Registration</CardTitle>
                <CardDescription>Primary trust gate for verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                <div className="space-y-4">
                    <Label className="text-lg">Are you registered with SEBI?</Label>
                    <RadioGroup
                        value={data.isSebiRegistered === true ? "yes" : data.isSebiRegistered === false ? "no" : ""}
                        onValueChange={(val) => updateData({ isSebiRegistered: val === "yes" })}
                        className="flex gap-6"
                    >
                        <div
                            onClick={() => updateData({ isSebiRegistered: true })}
                            className={cn(
                                "flex items-center space-x-2 border border-border p-4 rounded-md transition cursor-pointer w-full hover:bg-muted/50",
                                data.isSebiRegistered === true ? "bg-muted border-primary" : "bg-card"
                            )}>
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes" className="cursor-pointer">Yes, I am registered</Label>
                        </div>
                        <div
                            onClick={() => updateData({ isSebiRegistered: false })}
                            className={cn(
                                "flex items-center space-x-2 border border-border p-4 rounded-md transition cursor-pointer w-full hover:bg-muted/50",
                                data.isSebiRegistered === false ? "bg-muted border-primary" : "bg-card"
                            )}>
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no" className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>
                </div>

                {data.isSebiRegistered === true && (
                    <div className="space-y-6 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>License Type</Label>
                                <Select value={data.sebiLicenseType} onValueChange={(val) => updateData({ sebiLicenseType: val })}>
                                    <SelectTrigger className="bg-background border-input">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEBI_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Registration Number</Label>
                                <Input
                                    value={data.sebiRegNumber}
                                    onChange={(e) => updateData({ sebiRegNumber: e.target.value.toUpperCase() })}
                                    className="bg-background border-input"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Registered Name (Individual / Entity)</Label>
                                <Input
                                    value={data.sebiRegName}
                                    onChange={(e) => updateData({ sebiRegName: e.target.value })}
                                    className="bg-background border-input"
                                />
                            </div>

                            {/* File Upload Placeholder */}
                            <div className="space-y-2 md:col-span-2">
                                <Label>Upload SEBI Registration Certificate (PDF/Image)</Label>
                                <MediaUploader
                                    allowedTypes={["image", "pdf"]}
                                    maxFiles={1}
                                    maxSizeMB={2}
                                    intent={UploadIntent.VERIFICATION_DOC}
                                    uploadParams={{ userId: userId || "" }}
                                    existingMedia={data.sebiCertUrl ? [{ url: data.sebiCertUrl, type: data.sebiCertUrl.endsWith(".pdf") ? "PDF" : "IMAGE" }] : []}
                                    onChange={(files) => updateData({ sebiCertUrl: files[0]?.url })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={onBack}>Back</Button>
                    <Button onClick={handleNext} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
