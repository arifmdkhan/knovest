import { createAuthClient } from "better-auth/react";
import { emailOTPClient, multiSessionClient, inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";
import { ac, ADMIN, USER, SUPER_ADMIN } from "./access-control";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    emailOTPClient(),
    adminClient({
      ac,
      roles: {
        ADMIN,
        USER,
        SUPER_ADMIN,
      },
    }),
    usernameClient(),
    multiSessionClient(),
  ],
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
