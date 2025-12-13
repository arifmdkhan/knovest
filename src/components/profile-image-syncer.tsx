"use client";

import { useEffect } from "react";
import { syncProfileImage } from "@/server/actions/user";
import { authClient } from "@/lib/auth-client";

export function ProfileImageSyncer() {
    const { data: session } = authClient.useSession();

    useEffect(() => {
        if (session?.user?.image) {
            syncProfileImage();
        }
    }, [session]);

    return null;
}
