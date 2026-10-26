

import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
import TradeRoomDashboard from "./_components/TradeRoomDashboard";


export const dynamic = 'force-dynamic';

export default async function TradeRoomPage() {
    const session = await getServerSession();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <TradeRoomDashboard />
    );
}
