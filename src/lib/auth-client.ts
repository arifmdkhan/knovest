import { createAuthClient } from "better-auth/react";
import { emailOTPClient, multiSessionClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";
import { ac, ADMIN, USER, CREATOR } from "./access-control";


export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    adminClient({
      ac,
      roles: {
        ADMIN,
        USER,
        CREATOR,
      },
    }),
    usernameClient(),
    multiSessionClient(),
  ],
});
