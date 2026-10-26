import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, Mail } from "lucide-react";
import Link from "@/components/AppLink";

export default function BannedPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 bg-grid-white/10 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

            <Card className="w-full max-w-md border-destructive/20 shadow-2xl shadow-destructive/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-destructive/5 to-transparent pointer-events-none" />

                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
                        <Ban className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Account Suspended
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Your access to this application has been restricted due to a violation of our community guidelines.
                    </p>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground border border-border/50">
                        <p className="font-medium text-foreground mb-1">Why did this happen?</p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Violation of terms of service</li>
                            <li>Suspicious account activity</li>
                            <li>User reports or complaints</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button asChild className="w-full" variant="outline">
                        <Link href={process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}` : "/contact"}>
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Support
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                        <Link href="/login">
                            Return to Sign In
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
