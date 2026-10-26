"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { VerificationStatus } from "../../generated/prisma/enums";
import { getVerificationStatus } from "@/features/verification/actions/verification.action";
import { StepIdentity } from "./components/step-identity";
import { StepSebi } from "./components/step-sebi";
import { StepCertifications } from "./components/step-certifications";
import { StepPnl } from "./components/step-pnl";
import { StepDeclaration } from "./components/step-declaration";
import { StepSubmission } from "./components/step-submission";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "@/components/NavigationProvider";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export type VerificationFormData = {
    id?: string;
    fullName: string;
    dateOfBirth?: Date;
    nationality: string;
    state: string;
    panNumber: string;
    mobileNumber: string;

    isSebiRegistered: boolean | null;
    sebiLicenseType: string;
    sebiRegNumber: string;
    sebiRegName: string;
    sebiCertUrl: string;

    hasCertifications: boolean | null;
    certifications: any[];

    pnlVerified?: boolean;
    brokerPnls: any[];
    reviewNotes?: string | null;

    hasAgreedToTerms: boolean;
};

const STEPS = {
    IDENTITY: 1,
    SEBI: 2,
    CERTIFICATIONS: 3,
    PNL: 4,
    DECLARATION: 5,
    SUBMISSION_SUCCESS: 6,
};

export default function VerificationPage() {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [applicationStatus, setApplicationStatus] = useState<VerificationStatus | null>(null);
    const [currentStep, setCurrentStep] = useState(STEPS.IDENTITY);
    const [isEditing, setIsEditing] = useState(false);

    //Can use React hook form(will see later)
    const [formData, setFormData] = useState<VerificationFormData>({
        fullName: "",
        nationality: "Indian",
        state: "",
        panNumber: "",
        mobileNumber: "",
        isSebiRegistered: null,
        sebiLicenseType: "",
        sebiRegNumber: "",
        sebiRegName: "",
        sebiCertUrl: "",
        hasCertifications: null,
        certifications: [],
        brokerPnls: [],
        hasAgreedToTerms: false,
    });

    const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await getVerificationStatus();

                if (res.status === "success" && res.data) {
                    const { status, application, user } = res.data;
                    setApplicationStatus(status);

                    if (user) {
                        setUserProfile(user);

                        // Pre-fill full name from profile if not already set in draft
                        if (!application?.fullName) {
                            setFormData(prev => ({ ...prev, fullName: user.name }));
                        }
                    }

                    if (application) {
                        // Pre-fill form if draft exists
                        setFormData(prev => ({
                            ...prev,
                            id: application.id,
                            fullName: application.fullName || user?.name || "",
                            dateOfBirth: application.dateOfBirth ? new Date(application.dateOfBirth) : undefined,
                            panNumber: application.panNumber || "",
                            mobileNumber: application.mobileNumber || "",
                            nationality: application.nationality || "Indian",
                            state: application.state || "",

                            isSebiRegistered: application.isSebiRegistered,
                            sebiLicenseType: application.sebiLicenseType || "",
                            sebiRegNumber: application.sebiRegNumber || "",
                            sebiRegName: application.sebiRegName || "",
                            sebiCertUrl: application.sebiCertUrl || "",

                            hasCertifications: application.hasCertifications,
                            certifications: application.certifications || [],
                            brokerPnls: application.brokerPnls || [],

                            pnlVerified: application.pnlVerified || false, 
                            reviewNotes: application.reviewNotes,
                        }));
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Handle Already Processed States
    if (applicationStatus === "PENDING") {
        return <StepSubmission status="PENDING" applicationId={formData.id} />;
    }
    if (applicationStatus === "APPROVED" && !isEditing) {
        return (
            <div className="container max-w-xl py-20 mx-auto">
                <Card className="border-green-500/20 bg-green-500/5 p-10 text-center space-y-6">
                    <div className="flex justify-center">
                        <ShieldCheck className="w-16 h-16 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">You are Verified</h2>
                    <p className="text-muted-foreground text-lg">
                        You are already a verified expert on Knovest. Your badge is visible on your profile and content.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="outline" onClick={() => router.push("/home")}>
                            Go to Home
                        </Button>
                        <Button onClick={() => setIsEditing(true)}>
                            Update Details
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (applicationStatus === "REJECTED") {
    
        return <StepSubmission status="REJECTED" applicationId={formData.id} />;
    }
    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

   //render current state
    const renderStep = () => {
        switch (currentStep) {
            case STEPS.IDENTITY:
                return (
                    <StepIdentity
                        data={formData}
                        updateData={(d) => setFormData(p => ({ ...p, ...d }))}
                        onNext={nextStep}
                        userProfile={userProfile}
                    />
                );
            case STEPS.SEBI:
                return (
                    <StepSebi
                        data={formData}
                        updateData={(d) => setFormData(p => ({ ...p, ...d }))}
                        onNext={nextStep}
                        onBack={prevStep}
                        userId={session?.user?.id}
                    />
                );
            case STEPS.CERTIFICATIONS:
                return (
                    <StepCertifications
                        data={formData}
                        updateData={(d) => setFormData(p => ({ ...p, ...d }))}
                        onNext={nextStep}
                        onBack={prevStep}
                        userId={session?.user?.id}
                    />
                );
            case STEPS.PNL:
                // Skip P&L step if SEBI registered
                // If SEBI == Yes -> Skip to Declaration
                if (formData.isSebiRegistered) {
                   //We can make it better later
                    return <StepDeclaration data={formData} updateData={(d) => setFormData(p => ({ ...p, ...d }))} onBack={prevStep} onSubmitSuccess={(id) => {
                        setFormData(prev => ({ ...prev, id }));
                        setApplicationStatus("PENDING");
                    }} />;
                }

                return (
                    <StepPnl
                        data={formData}
                        updateData={(d) => setFormData(p => ({ ...p, ...d }))}
                        onNext={nextStep}
                        onBack={prevStep}
                        optional={formData.hasCertifications === true} 
                        userId={session?.user?.id}
                    />
                );
            case STEPS.DECLARATION:
                return (
                    <StepDeclaration
                        data={formData}
                        updateData={(d) => setFormData(p => ({ ...p, ...d }))}
                        onBack={prevStep}
                        onSubmitSuccess={(id) => {
                            setFormData(prev => ({ ...prev, id }));
                            setApplicationStatus("PENDING");
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />

            <div className="container max-w-3xl py-12 px-4 relative z-10 mx-auto">


                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Expert Verification
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Unlock premium features and build trust with your audience.
                    </p>
                </div>

                {applicationStatus === "ACTION_REQUIRED" && formData.reviewNotes && (
                    <Alert variant="destructive" className="mb-8 border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Info className="h-4 w-4 stroke-orange-600 dark:stroke-orange-400" />
                        <AlertTitle className="text-orange-600 dark:text-orange-400 font-semibold">Action Required</AlertTitle>
                        <AlertDescription className="mt-2 text-sm opacity-90">
                            The admin has requested changes to your application:
                            <div className="mt-2 p-3 bg-background/50 rounded border border-orange-500/20 font-medium">
                                &quot;{formData.reviewNotes}&quot;
                            </div>
                            <div className="mt-2">
                                Please update the relevant details below and resubmit.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div
                            key={step}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-300",
                                step <= currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                {renderStep()}
            </div>
        </div>
    );
}
