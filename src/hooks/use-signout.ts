"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectStreamClients } from "@/lib/stream-lifecycle";

export default function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleSignout = async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          await disconnectStreamClients();
          queryClient.clear();
          router.replace("/login");
          router.refresh();
          toast.success("logged out successfully");
        },
      },
    });
  };
  return handleSignout
}
