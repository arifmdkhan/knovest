export interface ProfileData {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    createdAt: Date;
    expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isSubscriptionEnabled: boolean;
    subscriptionPrice: number;
    subscribersCount?: number;
    expertise?: string[];
    verificationApplication?: {
        sebiRegNumber: string | null;
        sebiLicenseType: string | null;
        sebiExpiry: Date | null;
        sebiCertUrl: string | null;
        sebiRegName: string | null;
        certifications: {
            name: string;
            issuingAuthority: string | null;
            certUrl: string | null;
            completionYear: number | null;
        }[];
        brokerPnls: {
            brokerName: string;
            pnlLink: string;
            fileUrl: string | null;
        }[];
    } | null;
}
