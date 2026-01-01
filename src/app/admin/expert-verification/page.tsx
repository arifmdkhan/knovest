
export const dynamic = "force-dynamic";

import { getVerificationApplications } from "@/features/admin/verification.action";
import { ApplicationsList } from "./_components/applications-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";


export default async function ExpertVerificationAdminPage() {
    const res = await getVerificationApplications({});

    if (res.status === "error") {
        return (
            <div className="p-8 text-center text-destructive">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <h1 className="text-xl font-bold">Failed to load applications</h1>
                <p className="text-muted-foreground">{res.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Expert Verification Requests</h1>
                <p className="text-muted-foreground">
                    Review and manage incoming verification applications from creators.
                </p>
            </div>

            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>
                        A list of all verification requests. Pending requests require action.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationsList initialApplications={res.data || []} />
                </CardContent>
            </Card>
        </div>
    );
}
