export interface StreamUser {
    id: string;
    name?: string;
    image?: string;
    username?: string;
}

export interface CustomCallData {
    title?: string;
    description?: string;
    allowedGroups?: string[];
    allowedUserIds?: string[];
    permissionType?: 'everyone' | 'group' | 'specific';
}
