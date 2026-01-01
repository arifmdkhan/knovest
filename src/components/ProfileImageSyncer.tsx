"use client";

import { useEffect } from "react";
import { syncProfileImage } from "@/features/user/user.action";
import { authClient } from "@/lib/auth-client";

export function ProfileImageSyncer() {
    const { data: session } = authClient.useSession();

    useEffect(() => {
        if (session?.user?.image) {
            void (async () => {
                await syncProfileImage({});
            })();
        }
    }, [session]);

    return null;
}
