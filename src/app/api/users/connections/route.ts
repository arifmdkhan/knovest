import { getUserConnections, ConnectionType } from "@/app/data/user/get-connections";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") as ConnectionType;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId || !type) {
        return NextResponse.json({ error: "Missing userId or type" }, { status: 400 });
    }

    try {
        const data = await getUserConnections(userId, type, cursor, limit);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Connections API Error:", error);
        if (error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }
}
