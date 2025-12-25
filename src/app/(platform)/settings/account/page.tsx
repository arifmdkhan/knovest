import { AccountForm } from "../_components/AccountForm";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ActiveSessions } from "../_components/ActiveSessions";

export default async function AccountSettingsPage() {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id }
    });

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
            <AccountForm user={user} />
            <Separator />
            <ActiveSessions />
        </div>
    );
}
