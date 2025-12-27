"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Eye, FileText, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { approveApplication, rejectApplication, resetApplication, requestAdditionalInfo } from "@/server/actions/admin-verification.actions";
import { VerificationApplication, VerificationCertification, VerificationBrokerPnl } from "@/generated/prisma/client";
import { RotateCcw, MessageSquare } from "lucide-react"; // Import icon for reset/request info

// Define the shape of the data including relations
type ApplicationWithUser = VerificationApplication & {
    user: {
        name: string;
        email: string;
        image: string | null;
    };
    certifications: VerificationCertification[];
    brokerPnls: VerificationBrokerPnl[];
};

interface ApplicationsListProps {
    initialApplications: ApplicationWithUser[];
}

export function ApplicationsList({ initialApplications }: ApplicationsListProps) {
    const [applications, setApplications] = useState<ApplicationWithUser[]>(initialApplications);
    const [selectedApp, setSelectedApp] = useState<ApplicationWithUser | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleApprove = async () => {
        if (!selectedApp) return;
        setIsProcessing(true);
        try {
            const res = await approveApplication(selectedApp.id);
            if (res.status === "success") {
                toast.success("Application Approved");
                // Optimistic update
                setApplications(prev => prev.map(app =>
                    app.id === selectedApp.id ? { ...app, status: "APPROVED" as const } : app
                ));
                setIsDetailsOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApp) return;
        if (!rejectReason.trim()) {
            toast.error("Reason is required");
            return;
        }
        setIsProcessing(true);
        try {
            const res = await rejectApplication(selectedApp.id, rejectReason);
            if (res.status === "success") {
                toast.success("Application Rejected");
                setApplications(prev => prev.map(app =>
                    app.id === selectedApp.id ? { ...app, status: "REJECTED" as const, rejectionReason: rejectReason } : app
                ));
                setIsRejectDialogOpen(false);
                setIsDetailsOpen(false);
                setRejectReason("");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = async () => {
        if (!selectedApp) return;
        if (!confirm("Are you sure you want to reset this application to PENDING? This will revoke user verification if they are currently verified.")) return;

        setIsProcessing(true);
        try {
            const res = await resetApplication(selectedApp.id);
            if (res.status === "success") {
                toast.success("Application Reset to Pending");
                setApplications(prev => prev.map(app =>
                    app.id === selectedApp.id ? { ...app, status: "PENDING" as const } : app
                ));
                setIsDetailsOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const [infoReason, setInfoReason] = useState("");
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

    const handleRequestInfo = async () => {
        if (!selectedApp) return;
        if (!infoReason.trim()) {
            toast.error("Notes are required");
            return;
        }
        setIsProcessing(true);
        try {
            const res = await requestAdditionalInfo(selectedApp.id, infoReason);
            if (res.status === "success") {
                toast.success("Additional info requested");
                setApplications(prev => prev.map(app =>
                    app.id === selectedApp.id ? { ...app, status: "ACTION_REQUIRED" as const, reviewNotes: infoReason } : app
                ));
                setIsInfoDialogOpen(false);
                setIsDetailsOpen(false);
                setInfoReason("");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "APPROVED": return "bg-green-500/15 text-green-500 hover:bg-green-500/25";
            case "REJECTED": return "bg-red-500/15 text-red-500 hover:bg-red-500/25";
            case "PENDING": return "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25";
            case "ACTION_REQUIRED": return "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Applicant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No applications found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{app.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{app.user.email}</div>
                                        <div className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                                            ID: C{app.id.slice(-11).toUpperCase()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {app.isSebiRegistered && <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500">SEBI</Badge>}
                                            {app.hasCertifications && <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-500">Certified</Badge>}
                                            {app.pnlVerified && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">P&L</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColor(app.status)}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setSelectedApp(app); setIsDetailsOpen(true); }}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- Details Dialog --- */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl">
                    {selectedApp && (
                        <>
                            <DialogHeader className="p-6 pb-4 border-b border-border">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <DialogTitle className="text-xl">Verification Review</DialogTitle>
                                        <DialogDescription>
                                            Reviewing application for <span className="text-foreground font-medium">{selectedApp.fullName}</span>
                                        </DialogDescription>
                                    </div>
                                    <Badge variant="outline" className={statusColor(selectedApp.status)}>{selectedApp.status}</Badge>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* LEFT COL: Personal & SEBI */}
                                    <div className="space-y-6">
                                        <Section title="Identity Details" icon={<ShieldCheck className="w-4 h-4" />}>
                                            <DetailRow label="Full Name" value={selectedApp.fullName} />
                                            <DetailRow label="PAN Number" value={selectedApp.panNumber} />
                                            <DetailRow label="Mobile" value={selectedApp.mobileNumber} />
                                            <DetailRow label="DOB" value={selectedApp.dateOfBirth ? format(new Date(selectedApp.dateOfBirth), "PPP") : "-"} />
                                            <DetailRow label="Location" value={`${selectedApp.state || ""}, ${selectedApp.nationality || ""}`} />
                                        </Section>

                                        {selectedApp.isSebiRegistered && (
                                            <Section title="SEBI Registration" icon={<FileText className="w-4 h-4" />}>
                                                <DetailRow label="Reg. Number" value={selectedApp.sebiRegNumber} />
                                                <DetailRow label="Reg. Name" value={selectedApp.sebiRegName} />
                                                <DetailRow label="License Type" value={selectedApp.sebiLicenseType} />
                                                {selectedApp.sebiCertUrl && (
                                                    <div className="mt-2 pt-2 border-t border-border/50">
                                                        <p className="text-xs text-muted-foreground mb-1">Registration Certificate</p>
                                                        <AttachmentLink url={selectedApp.sebiCertUrl} />
                                                    </div>
                                                )}
                                            </Section>
                                        )}
                                    </div>

                                    {/* RIGHT COL: Certs & P&L */}
                                    <div className="space-y-6">
                                        {(selectedApp.certifications.length > 0) && (
                                            <Section title={`Certifications (${selectedApp.certifications.length})`} icon={<AlertCircle className="w-4 h-4 text-purple-500" />}>
                                                <div className="space-y-3">
                                                    {selectedApp.certifications.map((cert) => (
                                                        <div key={cert.id} className="bg-muted/30 p-3 rounded-md border border-border/50 text-sm">
                                                            <div className="font-medium">{cert.name}</div>
                                                            <div className="text-xs text-muted-foreground">{cert.issuingAuthority} • {cert.completionYear}</div>
                                                            {cert.certUrl && <div className="mt-2"><AttachmentLink url={cert.certUrl} label="View Certificate" /></div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>
                                        )}

                                        {(selectedApp.brokerPnls.length > 0) && (
                                            <Section title={`Verified P&L Links (${selectedApp.brokerPnls.length})`} icon={<ExternalLink className="w-4 h-4 text-emerald-500" />}>
                                                <div className="space-y-3">
                                                    {selectedApp.brokerPnls.map((pnl) => (
                                                        <div key={pnl.id} className="bg-muted/30 p-3 rounded-md border border-border/50 text-sm">
                                                            <div className="font-medium">{pnl.brokerName}</div>
                                                            <div className="text-xs text-muted-foreground mb-1">Holder: {pnl.accountHolder}</div>
                                                            <a href={pnl.pnlLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                                                                {pnl.pnlLink} <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                            {pnl.fileUrl && <div className="mt-2 pt-1"><AttachmentLink url={pnl.fileUrl} label="Supporting Doc" /></div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>

                            <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-between items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    {selectedApp.status === "PENDING" ? "Action required" : `Processed on ${format(new Date(selectedApp.updatedAt), "PPP")}`}
                                </div>

                                {selectedApp.status === "PENDING" && (
                                    <div className="flex gap-2">
                                        <RequestInfoDialog
                                            isOpen={isInfoDialogOpen}
                                            onOpenChange={setIsInfoDialogOpen}
                                            reason={infoReason}
                                            setReason={setInfoReason}
                                            onConfirm={handleRequestInfo}
                                            isProcessing={isProcessing}
                                        />

                                        <RejectDialog
                                            isOpen={isRejectDialogOpen}
                                            onOpenChange={setIsRejectDialogOpen}
                                            reason={rejectReason}
                                            setReason={setRejectReason}
                                            onConfirm={handleReject}
                                            isProcessing={isProcessing}
                                        />

                                        <Button
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                            onClick={handleApprove}
                                            disabled={isProcessing}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Verify & Approve
                                        </Button>
                                    </div>
                                )}

                                {selectedApp.status === "APPROVED" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Set Pending
                                        </Button>

                                        <RequestInfoDialog
                                            isOpen={isInfoDialogOpen}
                                            onOpenChange={setIsInfoDialogOpen}
                                            reason={infoReason}
                                            setReason={setInfoReason}
                                            onConfirm={handleRequestInfo}
                                            isProcessing={isProcessing}
                                        />

                                        <RejectDialog
                                            isOpen={isRejectDialogOpen}
                                            onOpenChange={setIsRejectDialogOpen}
                                            reason={rejectReason}
                                            setReason={setRejectReason}
                                            onConfirm={handleReject}
                                            isProcessing={isProcessing}
                                        />
                                    </div>
                                )}

                                {selectedApp.status === "REJECTED" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Set Pending
                                        </Button>

                                        <RequestInfoDialog
                                            isOpen={isInfoDialogOpen}
                                            onOpenChange={setIsInfoDialogOpen}
                                            reason={infoReason}
                                            setReason={setInfoReason}
                                            onConfirm={handleRequestInfo}
                                            isProcessing={isProcessing}
                                        />

                                        <Button
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                            onClick={handleApprove}
                                            disabled={isProcessing}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                    </div>
                                )}

                                {selectedApp.status === "ACTION_REQUIRED" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Set Pending
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                            onClick={handleApprove}
                                            disabled={isProcessing}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- Subcomponents ---

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80 border-b border-border/50 pb-1">
                {icon} {title}
            </h4>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium text-foreground break-words">{value}</span>
        </div>
    );
}

function AttachmentLink({ url, label = "View Document" }: { url: string, label?: string }) {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors text-xs font-medium text-primary w-fit"
        >
            {isPdf ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {label}
            <ExternalLink className="w-3 h-3 opacity-50 ml-1" />
        </a>
    );
}

function RejectDialog({ isOpen, onOpenChange, reason, setReason, onConfirm, isProcessing }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    reason: string,
    setReason: (val: string) => void,
    onConfirm: () => void,
    isProcessing: boolean
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isProcessing}>Reject</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background border-destructive/20">
                <DialogHeader>
                    <DialogTitle className="text-destructive">Reject Application</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejection. This will be shown to the user.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={!reason.trim() || isProcessing}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RequestInfoDialog({ isOpen, onOpenChange, reason, setReason, onConfirm, isProcessing }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    reason: string,
    setReason: (val: string) => void,
    onConfirm: () => void,
    isProcessing: boolean
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing} className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Info
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background border-orange-500/20">
                <DialogHeader>
                    <DialogTitle className="text-orange-600">Request Additional Information</DialogTitle>
                    <DialogDescription>
                        Explain what information is missing or needs correction. The user will be able to edit and resubmit.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Textarea
                        placeholder="Required changes..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={onConfirm}
                        disabled={!reason.trim() || isProcessing}
                    >
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
