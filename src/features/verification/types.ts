

export type VerificationApplicationInput = {
    // Step 1: Identity
    fullName?: string;
    dateOfBirth?: Date;
    nationality?: string;
    state?: string;
    panNumber?: string;
    mobileNumber?: string;

    // Step 2: SEBI
    isSebiRegistered?: boolean;
    sebiLicenseType?: string;
    sebiRegNumber?: string;
    sebiRegName?: string;
    sebiCertUrl?: string; // S3/R2 URL
    sebiExpiry?: Date;

    // Step 3: Certifications
    hasCertifications?: boolean;
    certifications?: {
        id?: string; // existing ID if updating
        name: string;
        issuingAuthority?: string;
        completionYear?: number;
        certNumber?: string;
        expiryDate?: Date;
        certUrl?: string;
    }[];

    // Step 4: P&L
    pnlVerified?: boolean;
    brokerPnls?: {
        id?: string;
        brokerName: string;
        pnlLink: string;
        accountHolder: string;
        fileUrl?: string;
    }[];

    hasAgreedToTerms?: boolean;
};
