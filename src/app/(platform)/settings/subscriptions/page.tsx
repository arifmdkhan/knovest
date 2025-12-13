import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SubscriptionSettings } from "../_components/SubscriptionSettings";
import { ManageSubscriptions } from "../_components/ManageSubscriptions";
import { getMySubscriptions } from "@/app/data/subscription/get-my-subscriptions";

export default async function SubscriptionSettingsPage() {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id }
    });

    if (!user) return redirect("/login");

    const mySubscriptions = await getMySubscriptions();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Subscriptions</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription plans and billing information.
                </p>
            </div>
            <Separator />

            {/* Creator Settings: Only show if verified/sebi_verified (handled inside component but helpful to know context) */}
            <SubscriptionSettings user={user} />

            {/* User Subscriptions: Reusing the management component */}
            <ManageSubscriptions subscriptions={mySubscriptions} />
        </div>
    );
}
