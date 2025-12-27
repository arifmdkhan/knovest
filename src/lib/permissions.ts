import { Role } from "@/generated/prisma/client";
import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
// Access control definitions moved to src/lib/access-control.ts

export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    redirect("/403"); // Or some unauthorized page
  }

  return session;
}


//admin
export async function requireAdmin() {
  return requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
}

export function hasRole(user: { role: string }, role: Role) {
  return user.role === role;
}
