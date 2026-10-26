import type { Metadata } from "next";
import { requireUser } from "@/features/user/queries/require-user";
import { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function VerificationLayout({ children }: { children: ReactNode }) {
    const user = await requireUser();

    return (
        <QueryProvider key={user.id}><div className="knovest-app min-h-screen bg-background text-foreground font-sans antialiased">
            {children}
        </div></QueryProvider>
    );
}
