import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

export const getServerSession = cache(async () => {
  // Authorization must observe revocation, bans, and role changes immediately.
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session || session.user.deletedAt) return null;
  const banned = session.user.banned &&
    (!session.user.banExpires || new Date(session.user.banExpires).getTime() > Date.now());
  if (banned) return null;
  return { ...session, user: { ...session.user, banned: false } };
});
