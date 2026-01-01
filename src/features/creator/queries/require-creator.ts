import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-sessions";
import { cache } from "react";

export const requireCreator = cache(async () => {
  const session = await getServerSession();

  if (!session) {
    return redirect("/login");
  }

  const isExpert = !!session.user.expertVerificationType;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  if (!isExpert && !isAdmin) {
    // Redirect non-experts/non-admins
    return redirect("/home?error=unauthorized_creator");
  }

  return session;
});


