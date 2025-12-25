"use server";

import { getUserConnections, ConnectionType } from "@/app/data/user/get-connections";

export async function getConnectionsAction(
    userId: string,
    type: ConnectionType,
    cursor?: string,
    limit = 10
) {
    try {
        const data = await getUserConnections(userId, type, cursor, limit);
        return data;
    } catch (error: unknown) {
        console.error("Error in getConnectionsAction:", error);
        // Ensure we propagate unauthorized errors clearly or return a safe fallback
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            throw new Error(error.message);
        }
        throw new Error("Failed to fetch connections");
    }
}
