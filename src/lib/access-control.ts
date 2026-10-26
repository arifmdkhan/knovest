import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, userAc, adminAc } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const SUPER_ADMIN = ac.newRole({
    ...adminAc.statements,
});

// Moderators cannot change identities, credentials, or application roles.
export const ADMIN = ac.newRole({
    user: ["list", "get", "ban"],
    session: ["list", "revoke"],
});
export const USER = ac.newRole({
    ...userAc.statements,
});
