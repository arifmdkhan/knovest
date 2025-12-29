import "server-only";

import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireUser = cache(async () => {
  const session = await getServerSession();
  if (!session) {
    return redirect("/login");
  }

  if (session.user.banned) {
    return redirect("/banned");
  }

  return session.user;
});
