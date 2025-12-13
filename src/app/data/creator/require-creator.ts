import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-sessions";
import { cache } from "react";

export const requireCreator = cache(async () => {
  const session = await getServerSession();
  if (!session) {
    return redirect("/login");
  }
  if (session.user.role === "USER") {
    return redirect("/not-admin");
  }
  return session;
});


