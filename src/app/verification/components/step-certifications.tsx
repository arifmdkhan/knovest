"use client";

import { VerificationFormData } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { saveApplicationDraft } from "@/server/actions/verification.actions";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

const CERT_TYPES = ["NISM", "CFA", "CA", "CS", "FRM", "MBA (Finance)", "CFP", "Other"];

export function StepCertifications({ data, updateData, onNext, onBack, userId }: StepProps) {
    const [saving, setSaving] = useState(false);

    // Helper to add empty cert
    const addCert = () => {
        updateData({
            certifications: [
                ...data.certifications,
                { name: "NISM", completionYear: new Date().getFullYear(), certNumber: "" }
            ]
        });
    };

    const removeCert = (idx: number) => {
        const newCerts = [...data.certifications];
        newCerts.splice(idx, 1);
        updateData({ certifications: newCerts });
    };

    const updateCert = (idx: number, field: string, val: any) => {
        const newCerts = [...data.certifications];
        newCerts[idx] = { ...newCerts[idx], [field]: val };
        updateData({ certifications: newCerts });
    };

    const handleNext = async () => {
        if (data.hasCertifications === null) {
            toast.error("Please answer if you have certifications.");
            return;
        }

        if (data.hasCertifications && data.certifications.length === 0) {
            toast.error("Please add at least one certification.");
            return;
        }

        if (data.hasCertifications) {
            const missingFile = data.certifications.some(c => !c.certUrl);
            if (missingFile) {
                toast.error("Please upload the certificate file for all added certifications.");
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
            toast.error(res.message || "Failed to save draft.");
        }
    };

    return (
        <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Professional Certifications</CardTitle>
                <CardDescription>Do you hold any recognized finance-related certifications?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                <div className="space-y-4">
                    <RadioGroup
                        value={data.hasCertifications === true ? "yes" : data.hasCertifications === false ? "no" : ""}
                        onValueChange={(val) => updateData({ hasCertifications: val === "yes" })}
                        className="flex gap-6"
                    >
                        <div
                            onClick={() => updateData({ hasCertifications: true })}
                            className={cn(
                                "flex items-center space-x-2 border border-border p-4 rounded-md transition cursor-pointer w-full hover:bg-muted/50",
                                data.hasCertifications === true ? "bg-muted border-primary" : "bg-card"
                            )}>
                            <RadioGroupItem value="yes" id="yes_cert" />
                            <Label htmlFor="yes_cert" className="cursor-pointer">Yes</Label>
                        </div>
                        <div
                            onClick={() => updateData({ hasCertifications: false })}
                            className={cn(
                                "flex items-center space-x-2 border border-border p-4 rounded-md transition cursor-pointer w-full hover:bg-muted/50",
                                data.hasCertifications === false ? "bg-muted border-primary" : "bg-card"
                            )}>
                            <RadioGroupItem value="no" id="no_cert" />
                            <Label htmlFor="no_cert" className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>
                </div>

                {data.hasCertifications === true && (
                    <div className="space-y-6 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                        {data.certifications.map((cert, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border relative space-y-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeCert(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Certification Name</Label>
                                        <Select value={cert.name} onValueChange={(v) => updateCert(idx, "name", v)}>
                                            <SelectTrigger className="bg-background border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Year of Completion</Label>
                                        <Input
                                            type="number"
                                            value={cert.completionYear}
                                            onChange={(e) => updateCert(idx, "completionYear", parseInt(e.target.value))}
                                            className="bg-background border-input"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Issuing Authority</Label>
                                        <Input
                                            value={cert.issuingAuthority || ""}
                                            onChange={(e) => updateCert(idx, "issuingAuthority", e.target.value)}
                                            placeholder="e.g. NISM, CFA Institute"
                                            className="bg-background border-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reg./Cert. Number (Optional)</Label>
                                        <Input
                                            value={cert.certNumber || ""}
                                            onChange={(e) => updateCert(idx, "certNumber", e.target.value)}
                                            className="bg-background border-input"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Upload Certificate</Label>
                                        <MediaUploader
                                            allowedTypes={["image", "pdf"]}
                                            maxFiles={1}
                                            maxSizeMB={2}
                                            intent={UploadIntent.VERIFICATION_DOC}
                                            uploadParams={{ userId: userId || "" }}
                                            existingMedia={cert.certUrl ? [{ url: cert.certUrl, type: cert.certUrl.endsWith(".pdf") ? "PDF" : "IMAGE" }] : []}
                                            onChange={(files) => updateCert(idx, "certUrl", files[0]?.url)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addCert} className="w-full border-dashed border-border hover:bg-muted">
                            <Plus className="w-4 h-4 mr-2" /> Add Certification
                        </Button>
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
