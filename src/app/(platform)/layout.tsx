import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";
import { PlatformShell } from "@/components/PlatformShell";
import { ReactNode } from "react";
import { requireUser } from "@/features/user/queries/require-user";
import { ActiveCallProvider } from "@/components/providers/ActiveCallProvider";
import { getStreamToken } from "@/features/media/actions/stream.action";
import GlobalVideoProvider from "@/components/providers/GlobalVideoProvider";
import { QueryProvider } from "@/components/providers/query-provider";
import { StreamChatConnectionProvider } from "@/components/providers/StreamChatConnectionProvider";

const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    const [user, res] = await Promise.all([
        requireUser(),
        getStreamToken({})
    ]);
    const token = res.status === "success" && res.data ? res.data : "";

    return (
        <QueryProvider key={user.id}><StreamChatConnectionProvider user={user} streamToken={token}><GlobalVideoProvider user={user} streamToken={token}>
            <ActiveCallProvider>
                <div className={`${serif.variable} ${mono.variable} contents`}><PlatformShell>{children}</PlatformShell></div>
            </ActiveCallProvider>
        </GlobalVideoProvider></StreamChatConnectionProvider></QueryProvider>
    );
}
export const dynamic = "force-dynamic";

