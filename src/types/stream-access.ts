export interface StreamAccessData {
    isPaid: boolean;
    price: number;
}

export type CustomCallDataWithAccess = {
    title?: string;
    description?: string;
    permissionType?: "everyone" | "group";
    allowedGroups?: string[];
    allowedUserIds?: string[];
    isPaid?: boolean;
    price?: number;
}
