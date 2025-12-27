"use server";

import { getUserConnections, ConnectionType } from "@/app/data/user/get-connections";
import { ApiResponse } from "@/lib/types";

export async function getConnectionsAction(
    userId: string,
    type: ConnectionType,
    cursor?: string,
    limit = 10
): Promise<ApiResponse<{ items: any[]; nextCursor?: string | undefined }>> {
    try {
        const data = await getUserConnections(userId, type, cursor, limit);
        return {
            status: "success",
            message: "Connections fetched successfully",
            data
        };
    } catch (error: unknown) {
        console.error("Error in getConnectionsAction:", error);

        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return { status: "error", message: "Unauthorized" };
        }

        return { status: "error", message: "Failed to fetch connections" };
    }
}
