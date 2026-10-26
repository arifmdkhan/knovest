"use client";

import { VerificationFormData } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveApplicationDraft } from "@/features/verification/actions/verification.action";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, AlertTriangle, LinkIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MediaUploader } from "@/components/handle-media/media-uploader";
import { UploadIntent } from "@/lib/storage/types";



interface StepProps {
    data: VerificationFormData;
    updateData: (data: Partial<VerificationFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    optional: boolean;
    userId?: string;
}

export function StepPnl({ data, updateData, onNext, onBack, optional, userId }: StepProps) {
    const [saving, setSaving] = useState(false);

    const addBroker = () => {
        if (data.brokerPnls.length >= 5) {
            toast.warning("Maximum 5 broker links allowed.");
            return;
        }
        updateData({
            brokerPnls: [
                ...data.brokerPnls,
                { brokerName: "", pnlLink: "", accountHolder: "" }
            ]
        });
    };

    const removeBroker = (idx: number) => {
        const newItems = [...data.brokerPnls];
        newItems.splice(idx, 1);
        updateData({ brokerPnls: newItems });
    };

    const updateBroker = (idx: number, field: string, val: any) => {
        const newItems = [...data.brokerPnls];
        newItems[idx] = { ...newItems[idx], [field]: val };
        updateData({ brokerPnls: newItems });
    };

    const handleNext = async () => {
        // If NOT optional (Mandatory P&L route), must have at least 1
        if (!optional && data.brokerPnls.length === 0) {
            toast.error("You must submit at least one verified P&L link for this category.");
            return;
        }

        // Validate URLs basic
        for (const b of data.brokerPnls) {
            if (!b.pnlLink.startsWith("http")) {
                toast.error("Please enter valid full URLs for P&L links (including https://).");
                return;
            }
        }

        setSaving(true);
        const res = await saveApplicationDraft({
            ...data,
            pnlVerified: true,
            isSebiRegistered: data.isSebiRegistered ?? undefined,
            hasCertifications: data.hasCertifications ?? undefined,
        }); // Flag that they reached P&L
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
                <CardTitle>Verified P&L {optional && "(Optional)"}</CardTitle>
                <CardDescription>
                    {optional
                        ? "Since you have certifications, this is optional but recommended to boost trust."
                        : "As you do not have SEBI registration or Certifications, this is MANDATORY."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-destructive">Eligibility Criteria</AlertTitle>
                    <AlertDescription className="text-destructive/80 mt-2 text-xs leading-relaxed">
                        Only users with <strong>₹5 Crore or more cumulative verified P&L</strong> in the last 1 financial year (excluding Mutual Funds)
                        are eligible for expert verification under this route. Mutual funds and PMS pooled accounts are not counted.
                    </AlertDescription>
                </Alert>

                <div className="space-y-6">
                    {data.brokerPnls.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                            No P&L links added yet.
                        </div>
                    )}

                    {data.brokerPnls.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border relative space-y-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                onClick={() => removeBroker(idx)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Broker Name</Label>
                                    <Input
                                        value={item.brokerName}
                                        onChange={(e) => updateBroker(idx, "brokerName", e.target.value)}
                                        placeholder="e.g. Zerodha, Angel One"
                                        className="bg-background border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Holder Name</Label>
                                    <Input
                                        value={item.accountHolder}
                                        onChange={(e) => updateBroker(idx, "accountHolder", e.target.value)}
                                        className="bg-background border-input"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Verified P&L Link</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={item.pnlLink}
                                            onChange={(e) => updateBroker(idx, "pnlLink", e.target.value)}
                                            placeholder="https://console.zerodha.com/verified/..."
                                            className="pl-9 bg-background border-input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Upload Verified P&L (PDF/Image) - Optional Fallback</Label>
                                    <MediaUploader
                                        allowedTypes={["image", "pdf"]}
                                        maxFiles={1}
                                        maxSizeMB={2}
                                        intent={UploadIntent.BROKER_PNL}
                                        uploadParams={{ userId: userId || "" }}
                                        existingMedia={item.fileUrl ? [{ url: item.fileUrl, type: item.fileUrl.endsWith(".pdf") ? "PDF" : "IMAGE" }] : []}
                                        onChange={(files) => updateBroker(idx, "fileUrl", files[0]?.url)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {data.brokerPnls.length < 5 && (
                        <Button variant="outline" onClick={addBroker} className="w-full border-dashed border-border hover:bg-muted">
                            <Plus className="w-4 h-4 mr-2" /> Add Broker Link
                        </Button>
                    )}
                </div>

                <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={onBack}>Back</Button>
                    <Button onClick={handleNext} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {optional && data.brokerPnls.length === 0 ? "Skip" : "Continue"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
