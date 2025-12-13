import { createAccessControl } from "better-auth/plugins/access";
import {
    defaultStatements,
    userAc,
    adminAc,
} from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const ADMIN = ac.newRole(adminAc.statements);
export const USER = ac.newRole({
    ...userAc.statements,
});
export const CREATOR = ac.newRole({
    ...userAc.statements,
});
