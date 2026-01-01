import { requireUser } from "@/features/user/queries/require-user";
import { ReactNode } from "react";

export default async function VerificationLayout({ children }: { children: ReactNode }) {
    await requireUser();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
            {children}
        </div>
    );
}
