import { AccountForm } from "../_components/AccountForm";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ActiveSessions } from "../_components/ActiveSessions";

export default async function AccountSettingsPage() {
    const sessionUser = await requireUser();
    const [user, verificationApp] = await Promise.all([
        prisma.user.findUnique({ where: { id: sessionUser.id } }),
        prisma.verificationApplication.findUnique({ where: { userId: sessionUser.id } })
    ]);

    if (!user) return redirect("/login");

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Account</h3>
                <p className="text-sm text-muted-foreground">
                    Update your account settings. Set your preferred username and display name.
                </p>
            </div>
            <Separator />

            {/* Verification Status Section */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Expert Verification</h3>
                    <p className="text-sm text-muted-foreground">Status of your application to become a verified expert.</p>
                </div>
                <div className="p-6 pt-0">
                    {!verificationApp ? (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">You have not applied for verification yet.</span>
                            <a href="/verification" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                                Apply Now
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Current Status:</span>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${verificationApp.status === "APPROVED" ? "border-transparent bg-green-500/15 text-green-600 hover:bg-green-500/25" :
                                    verificationApp.status === "REJECTED" ? "border-transparent bg-red-500/15 text-red-600 hover:bg-red-500/25" :
                                        verificationApp.status === "ACTION_REQUIRED" ? "border-transparent bg-orange-500/15 text-orange-600 hover:bg-orange-500/25" :
                                            "border-transparent bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25"
                                    }`}>
                                    {verificationApp.status === "ACTION_REQUIRED" ? "ACTION REQUIRED" : verificationApp.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                <span>Application ID:</span>
                                <span>C{verificationApp.id.slice(-11).toUpperCase()}</span>
                            </div>

                            {verificationApp.status === "ACTION_REQUIRED" && verificationApp.reviewNotes && (
                                <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-4 text-sm text-orange-800 dark:text-orange-400">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="font-semibold mb-1">Admin Feedback:</p>
                                            <p className="text-muted-foreground">{verificationApp.reviewNotes}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <a href="/verification" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-9 px-4 py-2">
                                            Update Application
                                        </a>
                                    </div>
                                </div>
                            )}

                            {verificationApp.status === "REJECTED" && verificationApp.rejectionReason && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    <p className="font-semibold mb-1">Rejection Reason:</p>
                                    <p>{verificationApp.rejectionReason}</p>
                                    <div className="mt-3 pt-3 border-t border-destructive/20 text-xs font-medium opacity-90">
                                        You are not eligible now. Apply after 3 months.
                                    </div>
                                </div>
                            )}

                            {verificationApp.status === "APPROVED" && (
                                <p className="text-sm text-muted-foreground">
                                    You are a verified expert. Your badge is visible on your profile.
                                </p>
                            )}
                            {verificationApp.status === "PENDING" && (
                                <p className="text-sm text-muted-foreground">
                                    Your application is currently under review. This process typically takes 24-48 hours.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Separator />
            <AccountForm user={user} />
            <Separator />
            <ActiveSessions />
        </div>
    );
}
