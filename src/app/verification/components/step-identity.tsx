"use client";

import { VerificationFormData } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveApplicationDraft } from "@/server/actions/verification.actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "../constants";
import { ChevronDownIcon } from "lucide-react";

interface StepProps {
    data: VerificationFormData;
    updateData: (data: Partial<VerificationFormData>) => void;
    onNext: () => void;
    userProfile: { name: string; email: string } | null;
}

// Zod Schema for Validation
const identitySchema = z.object({
    fullName: z.string().min(2, "Full Name is required"),
    dateOfBirth: z.date({ message: "Date of Birth is required" })
        .refine((date) => {
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            const m = today.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
                return age - 1 >= 18;
            }
            return age >= 18;
        }, "You must be at least 18 years old to verify as an expert."),
    nationality: z.string().min(1, "Nationality is required"),
    state: z.string().min(1, "State is required"),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid format. Please enter a valid PAN Number (e.g., ABCDE1234F)"),
    mobileNumber: z.string().regex(/^[0-9]{10}$/, "Mobile Number must be 10 digits"),
});

export function StepIdentity({ data, updateData, onNext, userProfile }: StepProps) {
    const [saving, setSaving] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validate a single field on blur or change
    const validateField = (field: keyof z.infer<typeof identitySchema>, value?: any) => {
        try {
            const fieldValue = value !== undefined ? value : data[field];
            const fieldValidator = identitySchema.shape[field as keyof typeof identitySchema.shape];

            if (!fieldValidator) return;

            const result = fieldValidator.safeParse(fieldValue);

            if (!result.success) { // Simplify check
                setErrors(prev => ({
                    ...prev,
                    [field]: result.error.issues[0]?.message || "Invalid input"
                }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        } catch (error) {
            console.error("Validation error", error);
        }
    };

    const handleNext = async () => {
        setErrors({});
        // Validate with Zod
        const result = identitySchema.safeParse({
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            nationality: data.nationality,
            state: data.state,
            panNumber: data.panNumber,
            mobileNumber: data.mobileNumber
        });

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            if (result.error) {
                result.error.issues.forEach((err) => {
                    if (err.path && err.path.length > 0) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
            } setErrors(newErrors);
            return;
        }

        setSaving(true);
        // Auto-save draft - Fix null vs undefined
        const cleanData = {
            ...data,
            isSebiRegistered: data.isSebiRegistered ?? undefined,
            hasCertifications: data.hasCertifications ?? undefined,
            reviewNotes: data.reviewNotes ?? undefined,
            // Ensure other optional fields are undefined if null
        }
        const res = await saveApplicationDraft(cleanData);
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
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>Complete your verification details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Section 1: Linked Profile Info */}
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Linked Account</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Profile Name</Label>
                            <div className="text-sm font-medium text-foreground">{userProfile?.name || "Loading..."}</div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Email Address</Label>
                            <div className="text-sm font-medium text-foreground">{userProfile?.email || "Loading..."}</div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Identity Form */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <h3 className="text-lg font-semibold text-foreground">Identity Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Legal Name */}
                        <div className="space-y-2">
                            <Label className={errors.fullName ? "text-destructive" : ""}>Legal Name (as per PAN record)</Label>
                            <Input
                                value={data.fullName}
                                onChange={(e) => updateData({ fullName: e.target.value })}
                                onBlur={() => validateField("fullName")}
                                className={cn("bg-background border-input", errors.fullName && "border-destructive focus-visible:ring-destructive")}
                                placeholder="Enter your full legal name"
                            />
                            {errors.fullName && <p className="text-xs text-destructive font-medium mt-1">{errors.fullName}</p>}
                        </div>

                        {/* Date of Birth - DatePicker */}
                        <div className="space-y-2">
                            <Label className={errors.dateOfBirth ? "text-destructive" : ""}>Date of Birth</Label>
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal bg-background border-input hover:bg-muted justify-between",
                                            !data.dateOfBirth && "text-muted-foreground",
                                            errors.dateOfBirth && "border-destructive focus-visible:ring-destructive"
                                        )}
                                    >
                                        {data.dateOfBirth ? (
                                            format(data.dateOfBirth, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={data.dateOfBirth}
                                        onSelect={(date) => {
                                            updateData({ dateOfBirth: date });
                                            setDatePickerOpen(false);
                                            // Validate immediately on selection
                                            if (date) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.dateOfBirth;
                                                    return newErrors;
                                                });
                                                // Check age logic
                                                const today = new Date();
                                                const age = today.getFullYear() - date.getFullYear();
                                                const m = today.getMonth() - date.getMonth();
                                                const isUnderage = (m < 0 || (m === 0 && today.getDate() < date.getDate())) ? (age - 1 < 18) : (age < 18);

                                                if (isUnderage) {
                                                    setErrors(prev => ({ ...prev, dateOfBirth: "You must be at least 18 years old to verify as an expert." }));
                                                }
                                            }
                                        }}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        captionLayout="dropdown"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.dateOfBirth && <p className="text-xs text-destructive font-medium mt-1">{errors.dateOfBirth}</p>}
                        </div>

                        {/* Nationality */}
                        <div className="space-y-2">
                            <Label className={errors.nationality ? "text-destructive" : ""}>Nationality</Label>
                            <Input
                                value={data.nationality}
                                onChange={(e) => updateData({ nationality: e.target.value })}
                                onBlur={() => validateField("nationality")}
                                className={cn("bg-background border-input", errors.nationality && "border-destructive focus-visible:ring-destructive")}
                                placeholder="e.g. Indian"
                            />
                            {errors.nationality && <p className="text-xs text-destructive font-medium mt-1">{errors.nationality}</p>}
                        </div>

                        {/* State - Dropdown */}
                        <div className="space-y-2">
                            <Label className={errors.state ? "text-destructive" : ""}>State</Label>
                            <Select
                                value={data.state}
                                onValueChange={(value) => {
                                    updateData({ state: value });
                                    setErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                                }}
                            >
                                <SelectTrigger className={cn("bg-background border-input", errors.state && "border-destructive focus-visible:ring-destructive")}>
                                    <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDIAN_STATES.map((state) => (
                                        <SelectItem key={state} value={state}>
                                            {state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.state && <p className="text-xs text-destructive font-medium mt-1">{errors.state}</p>}
                        </div>

                        {/* PAN Number */}
                        <div className="space-y-2">
                            <Label className={errors.panNumber ? "text-destructive" : ""}>PAN Number</Label>
                            <Input
                                value={data.panNumber}
                                onChange={(e) => {
                                    let val = e.target.value.toUpperCase();
                                    // Strict Input Masking for PAN (ABCDE1234F)
                                    // 1. Remove any non-alphanumeric chars immediately
                                    val = val.replace(/[^A-Z0-9]/g, '');

                                    // 2. Truncate to 10
                                    val = val.slice(0, 10);

                                    // 3. Re-build valid string char by char
                                    let cleanVal = "";
                                    for (let i = 0; i < val.length; i++) {
                                        const char = val[i];
                                        // First 5 chars: Letters only
                                        if (i < 5) {
                                            if (/[A-Z]/.test(char)) cleanVal += char;
                                        }
                                        // Next 4 chars: Numbers only
                                        else if (i >= 5 && i < 9) {
                                            if (/[0-9]/.test(char)) cleanVal += char;
                                        }
                                        // Last char: Letter only
                                        else if (i === 9) {
                                            if (/[A-Z]/.test(char)) cleanVal += char;
                                        }
                                    }

                                    updateData({ panNumber: cleanVal });

                                    // Instant validation for PAN Completion
                                    if (cleanVal.length === 10) {
                                        validateField("panNumber", cleanVal);
                                    } else {
                                        // Clear error while typing if incomplete
                                        setErrors(prev => {
                                            const n = { ...prev };
                                            delete n.panNumber;
                                            return n;
                                        });
                                    }
                                }}
                                onBlur={() => validateField("panNumber")}
                                maxLength={10}
                                placeholder="ABCDE1234F"
                                className={cn("bg-background border-input uppercase", errors.panNumber && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.panNumber ? (
                                <p className="text-xs text-destructive font-medium mt-1">{errors.panNumber}</p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground mt-1">Format: 5 letters, 4 numbers, 1 letter.</p>
                            )}
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-2">
                            <Label className={errors.mobileNumber ? "text-destructive" : ""}>Mobile Number</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">
                                    +91
                                </span>
                                <Input
                                    value={data.mobileNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        updateData({ mobileNumber: val.slice(0, 10) });
                                    }}
                                    onBlur={() => validateField("mobileNumber")}
                                    type="tel"
                                    placeholder="9876543210"
                                    className={cn("bg-background border-input pl-10", errors.mobileNumber && "border-destructive focus-visible:ring-destructive")}
                                />
                            </div>
                            {errors.mobileNumber && <p className="text-xs text-destructive font-medium mt-1">{errors.mobileNumber}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleNext} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Continue
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
