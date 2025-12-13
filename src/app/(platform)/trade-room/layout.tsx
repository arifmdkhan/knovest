
import { redirect } from "next/navigation";
import TradeRoomLayoutClient from "./_components/TradeRoomLayoutClient";
import { getServerSession } from "@/lib/get-sessions";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

export default async function TradeRoomLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <TradeRoomLayoutClient user={session.user}>
            {children}
        </TradeRoomLayoutClient>
    );
}
