"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ShieldCheck, Award, TrendingUp, ExternalLink, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileData } from "@/types/user";

interface VerificationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: ProfileData;
}

export function VerificationDetailsModal({
    isOpen,
    onClose,
    profile,
}: VerificationDetailsModalProps) {
    const { expertVerificationType, verificationApplication } = profile;

    if (!expertVerificationType) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                            "p-3 rounded-xl",
                            expertVerificationType === "SEBI" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            expertVerificationType === "CERTIFIED" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            expertVerificationType === "TRACK_RECORD" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        )}>
                            {expertVerificationType === "SEBI" && <ShieldCheck className="w-8 h-8" />}
                            {expertVerificationType === "CERTIFIED" && <Award className="w-8 h-8" />}
                            {expertVerificationType === "TRACK_RECORD" && <TrendingUp className="w-8 h-8" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Verified Expert Status</DialogTitle>
                            <p className="text-muted-foreground text-sm font-normal">
                                {expertVerificationType === "SEBI" && "SEBI Registered Professional"}
                                {expertVerificationType === "CERTIFIED" && "Certified Financial Expert"}
                                {expertVerificationType === "TRACK_RECORD" && "Verified P&L"}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* SEBI CONTENT */}
                    {expertVerificationType === "SEBI" && verificationApplication && (
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Registration Number</p>
                                        <p className="text-lg font-mono font-bold text-foreground">{verificationApplication.sebiRegNumber}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-background text-green-600 border-green-200">Active</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Type</p>
                                        <p className="font-medium">{verificationApplication.sebiLicenseType || "Research Analyst"}</p>
                                    </div>
                                    {verificationApplication.sebiExpiry && (
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Valid Until</p>
                                            <p className="font-medium">{format(new Date(verificationApplication.sebiExpiry), "MMM d, yyyy")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {verificationApplication.sebiCertUrl && (
                                <Button variant="outline" className="w-full gap-2" asChild>
                                    <a href={verificationApplication.sebiCertUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="w-4 h-4" /> View SEBI Certificate
                                    </a>
                                </Button>
                            )}

                            <p className="text-xs text-muted-foreground text-center">
                                This verification status indicates that the user currently holds a valid registration with the Securities and Exchange Board of India (SEBI).
                            </p>
                        </div>
                    )}

                    {/* CERTIFIED CONTENT */}
                    {expertVerificationType === "CERTIFIED" && verificationApplication?.certifications && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Certifications</h4>
                            <div className="grid gap-3">
                                {verificationApplication.certifications.length > 0 ? (
                                    verificationApplication.certifications.map((cert: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                                            <Award className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-foreground">{cert.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {cert.issuingAuthority} • {cert.completionYear}
                                                </p>
                                            </div>
                                            {cert.certUrl && (
                                                <a href={cert.certUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded-full">
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                </a>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No certification details available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TRACK RECORD CONTENT */}
                    {expertVerificationType === "TRACK_RECORD" && verificationApplication?.brokerPnls && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-100 dark:border-purple-800/30">
                                <p className="text-sm text-purple-800 dark:text-purple-300 font-medium text-center">
                                    This user has verified their trading performance through broker API integration or P&L statement analysis.
                                </p>
                            </div>

                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4">Verified Source</h4>
                            <div className="grid gap-3">
                                {verificationApplication.brokerPnls.map((pnl: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-purple-500" />
                                            <span className="font-medium text-sm">{pnl.brokerName}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-xs">
                                            <a href={pnl.pnlLink} target="_blank" rel="noopener noreferrer">
                                                View P&L <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
