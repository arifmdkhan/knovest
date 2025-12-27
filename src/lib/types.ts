

// Standard API Response for Server Actions
export type ApiResponse<T = void> =
  | { status: 'success'; message: string; data?: T }
  | { status: 'error'; message: string };




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
}
