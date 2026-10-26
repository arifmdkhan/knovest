import { Role } from "@/generated/prisma/client";
import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";


async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.banned) redirect("/banned");

  if (!allowedRoles.includes(session.user.role as Role)) {
    redirect("/home?error=forbidden");
  }

  return session;
}


//admin
export async function requireAdmin() {
  return requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
}


