import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SubscriptionSettings } from "../_components/SubscriptionSettings";
import { ManageSubscriptions } from "../_components/ManageSubscriptions";
import { getMySubscriptions } from "@/features/subscriptions/queries/get-my-subscriptions.query";

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

            {/* Only show if SEBI verified expert */}
            <SubscriptionSettings user={user} />

            {/* User Subscriptions */}
            <ManageSubscriptions subscriptions={mySubscriptions} />
        </div>
    );
}
