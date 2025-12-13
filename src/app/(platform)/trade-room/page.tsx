
import { StreamClient } from "@stream-io/node-sdk";
import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
import TradeRoomDashboard from "./_components/TradeRoomDashboard";
import { CustomCallData } from "@/types/stream";

export const dynamic = 'force-dynamic';

export default async function TradeRoomPage() {
    const session = await getServerSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Initialize Server Clients - REMOVED to prevent serialization issues
    // Client-side fetching in TradeRoomDashboard handles this logic.

    // Fetch Active Live Streams and Audio Rooms in parallel - REMOVED

    // Filter logic for initial view (simple visibility check) - REMOVED
    // We rely on client-side fetching for LCP optimization isn't worth the serialization risk of Call objects.

    return (
        <TradeRoomDashboard />
    );
}
