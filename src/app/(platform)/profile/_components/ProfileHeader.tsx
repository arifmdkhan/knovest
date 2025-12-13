"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { toggleFollow } from "@/server/actions/user";
import { createDM } from "@/server/actions/stream";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { EditProfileDialog } from "./EditProfileDialog";
import { SubscribeButton } from "./SubscribeButton";
import { UserListDialog } from "./UserListDialog";

interface ProfileData {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: Date;
  isVerified: boolean;
  isSebiVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSubscriptionEnabled: boolean;
  subscriptionPrice: number;
  subscribersCount?: number;
}

interface ProfileHeaderProps {
  profile: ProfileData;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const isCurrentUser = session?.user?.id === profile.id;

  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followersCount, setFollowersCount] = useState(profile.followersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  const [activeList, setActiveList] = useState<{
    type: "FOLLOWERS" | "FOLLOWING" | "SUBSCRIBERS";
    title: string;
  } | null>(null);

  const handleFollow = async () => {
    if (!session) {
      toast.error("Please login to follow users");
      return;
    }
    if (isLoading) return;

    const prevFollowing = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    setIsLoading(true);

    try {
      const res = await toggleFollow(profile.id);
      if (res.status === "error") throw new Error(res.message);

      if (res.data) {
        setIsFollowing(res.data.isFollowing);
        setFollowersCount(res.data.followersCount);
      }
      toast.success(res.message);
    } catch (error: any) {
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      toast.error(error.message || "Failed to follow");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!session) {
      toast.error("Please login to message users");
      return;
    }
    setIsMessaging(true);
    try {
      const channelId = await createDM(profile.id);
      router.push(`/chat/${channelId}`);
    } catch (error) {
      toast.error("Failed to start chat");
    } finally {
      setIsMessaging(false);
    }
  };

  const openList = (type: "FOLLOWERS" | "FOLLOWING" | "SUBSCRIBERS", title: string) => {
    if (isCurrentUser) setActiveList({ type, title });
  };

  return (
    <div className="w-full bg-card border-b border-border/50 pb-6">
      {/* Banner */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
      </div>

      <div className="container max-w-4xl mx-auto px-4">
        {/* Avatar + Right-Aligned Button Column */}
        <div className="relative -mt-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Avatar */}
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl ring-4 ring-background z-10">
            <AvatarImage src={profile.image || ""} alt={profile.name} />
            <AvatarFallback className="text-5xl font-bold bg-muted">
              {profile.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Buttons: Stacked column on mobile, aligned right */}
          {/* Added w-fit and ml-auto */}
          <div className="flex flex-col gap-3 items-end lg:items-start lg:flex-row w-fit ml-auto mr-5 mt-[-35px]  md:mt-18 lg:mt-0">
            {isCurrentUser ? (
              <div className="self-end md:self-auto">
                <EditProfileDialog profile={profile} />
              </div>
            ) : (
              <>
                {/* Message Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-medium px-5 min-w-[110px] "
                  onClick={handleMessage}
                  disabled={isMessaging}
                >
                  {isMessaging ? "..." : "Message"}
                </Button>

                {/* Subscribe Button */}
                {profile.isSubscriptionEnabled && (
                  <SubscribeButton
                    creatorId={profile.id}
                    price={profile.subscriptionPrice}
                  />
                )}

                {/* Follow Button */}
                <Button
                  onClick={handleFollow}
                  disabled={isLoading}
                  size="sm"
                  className={`rounded-full font-semibold px-6 min-w-[110px] transition-all ${isFollowing
                    ? "border border-border hover:bg-destructive/10 hover:text-destructive"
                    : "shadow-lg shadow-primary/30"
                    }`}
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 space-y-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {profile.name}
              </h1>
              {(profile.isVerified || profile.isSebiVerified) && (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
              {profile.isSebiVerified && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
                  <ShieldCheck className="w-4 h-4" /> SEBI RA
                </Badge>
              )}

            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-foreground/90 whitespace-pre-wrap max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Expertise Badges */}
          {(profile as any).expertise && (profile as any).expertise.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(profile as any).expertise.map((badge: string) => (
                <Badge key={badge} variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {profile.location}
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm pt-4 border-t border-border/40">
            <button
              className="hover:underline disabled:cursor-default text-left"
              onClick={() => openList("FOLLOWING", "Following")}
              disabled={!isCurrentUser}
            >
              <span className="font-bold text-foreground">{profile.followingCount}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button
              className="hover:underline disabled:cursor-default text-left"
              onClick={() => openList("FOLLOWERS", "Followers")}
              disabled={!isCurrentUser}
            >
              <span className="font-bold text-foreground">{followersCount}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </button>
            {profile.isSubscriptionEnabled && (
              <button
                className="hover:underline disabled:cursor-default text-left"
                onClick={() => openList("SUBSCRIBERS", "Subscribers")}
                disabled={!isCurrentUser}
              >
                <span className="font-bold text-foreground">
                  {(profile as any).subscribersCount || 0}
                </span>{" "}
                <span className="text-muted-foreground">Subscribers</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      {activeList && (
        <UserListDialog
          isOpen={!!activeList}
          onClose={() => setActiveList(null)}
          userId={profile.id}
          type={activeList.type}
          title={activeList.title}
        />
      )}
    </div>
  );
}