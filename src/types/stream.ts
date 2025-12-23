export type CustomCallData = {
    title?: string;
    description?: string;
    permissionType?: "everyone" | "group";
    allowedGroups?: string[];
    allowedUserIds?: string[];
    isPaid?: boolean;
    price?: number;
}
