"use client";

import { useEffect, useState } from "react";
import type { Call } from "@stream-io/video-react-sdk";
import { getRoomHosts } from "@/features/media/actions/get-room-hosts";

type Host = NonNullable<Extract<Awaited<ReturnType<typeof getRoomHosts>>, { status: "success" }>["data"]>[number];

export function useRoomHosts(calls: Call[]) {
    const [hosts, setHosts] = useState<Record<string, Host>>({});
    const ids = [...new Set(calls.map(call => call.state.createdBy?.id).filter((id): id is string => !!id))].sort().join(",");

    useEffect(() => {
        if (!ids) return;
        let active = true;
        getRoomHosts({ userIds: ids.split(",") }).then(result => {
            if (active && result.status === "success" && result.data) {
                setHosts(Object.fromEntries(result.data.map(host => [host.id, host])));
            }
        }).catch(() => { /* Keep the SDK display name while profile data is unavailable. */ });
        return () => { active = false; };
    }, [ids]);

    return hosts;
}
