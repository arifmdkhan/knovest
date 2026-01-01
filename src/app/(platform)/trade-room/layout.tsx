import { redirect } from "next/navigation";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import TradeRoomLayoutClient from "./_components/TradeRoomLayoutClient";
import { getServerSession } from "@/lib/get-sessions";
import { getStreamToken } from "@/features/media/actions/stream.action";
import { StreamChatProvider } from "@/components/providers/StreamChatProvider";

export default async function TradeRoomLayout({ children }: { children: React.ReactNode }) {
    const [session, tokenRes] = await Promise.all([
        getServerSession(),
        getStreamToken({})
    ]);

    if (!session) {
        redirect("/login");
    }

    const token = tokenRes.status === "success" && tokenRes.data ? tokenRes.data : "";

    return (
        <StreamChatProvider user={session.user} streamToken={token}>
            <TradeRoomLayoutClient user={session.user}>
                {children}
            </TradeRoomLayoutClient>
        </StreamChatProvider>
    );
}
