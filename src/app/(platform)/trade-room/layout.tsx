import { redirect } from "next/navigation";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import TradeRoomLayoutClient from "./_components/TradeRoomLayoutClient";
import { getServerSession } from "@/lib/get-sessions";
import { StreamChatProvider } from "@/components/providers/StreamChatProvider";

export default async function TradeRoomLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <StreamChatProvider skeleton="room">
            <TradeRoomLayoutClient user={session.user}>
                {children}
            </TradeRoomLayoutClient>
        </StreamChatProvider>
    );
}
