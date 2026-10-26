"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Link as LinkIcon, Calendar, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "@/components/NavigationProvider";
import { toggleFollow } from "@/features/user/user.action";
import { createDM } from "@/features/media/actions/stream.action";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { EditProfileDialog } from "./EditProfileDialog";
import { SubscribeButton } from "./SubscribeButton";
import { UserListDialog } from "./UserListDialog";
import { VerificationDetailsModal } from "./VerificationDetailsModal";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { ProfileData } from "@/types/user";

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
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
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
      const res = await toggleFollow({ targetUserId: profile.id });
      if (res.status === "error") throw new Error(res.message);

      if (res.data) {
        setIsFollowing(res.data.isFollowing);
        setFollowersCount(res.data.followersCount);
      }
      toast.success(res.message);
    } catch (error: unknown) {
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      const errorMessage = error instanceof Error ? error.message : "Failed to follow";
      toast.error(errorMessage);
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
      const res = await createDM({ targetUserId: profile.id });
      if (res.status === "success" && res.data) {
        router.push(`/chat/${res.data}`);
      } else {
        toast.error(res.message || "Failed to start chat");
      }
    } catch {
      toast.error("Failed to start chat");
    } finally {
      setIsMessaging(false);
    }
  };

  const openList = (type: "FOLLOWERS" | "FOLLOWING" | "SUBSCRIBERS", title: string) => {
    if (isCurrentUser) setActiveList({ type, title });
  };

  return (
    <div className="app-panel relative isolate w-full overflow-hidden pb-7">
      <div className="cosmos" aria-hidden="true" />
      {/* Profile actions */}
      <div className="absolute inset-x-0 top-0 h-16">
        
        <div className="absolute top-4 right-4 z-20">
          <ProfileActionsMenu username={profile.username || ""} isCurrentUser={isCurrentUser} />
        </div>
      </div>

      <div className="relative px-6 pt-10 md:px-9">
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          {/* Avatar */}
          <Avatar className="size-24 md:size-28 border-4 border-card shadow-lg ring-1 ring-border">
            <AvatarImage src={profile.image || ""} alt={profile.name} />
            <AvatarFallback className="text-5xl font-bold bg-muted">
              {profile.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-3 items-center ml-auto">
            {isCurrentUser ? (
              <div className="self-end md:self-auto flex items-center gap-2">
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
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {profile.name}
              </h1>
              {/*ACCOUNT VERIFICATION */}
              <VerificationBadge accountType={profile.accountVerificationType} className="w-5 h-5" />
              {/*  EXPERT VERIFICATION  */}
              {profile.expertVerificationType === "SEBI" && (
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setIsVerificationModalOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsVerificationModalOpen(true); } }}
                >
                  <VerificationBadge
                    expertType="SEBI"
                    className="h-6 group-hover:bg-green-500/20 transition-colors"
                    iconClassName="w-4 h-4"
                  />

                </div>
              )}
              {profile.expertVerificationType === "CERTIFIED" && (
                <div
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsVerificationModalOpen(true); } }}
                >
                  <VerificationBadge
                    expertType="CERTIFIED"
                    className="h-6 group-hover:bg-blue-500/20 transition-colors"
                    iconClassName="w-4 h-4"
                  />
                </div>
              )}
              {profile.expertVerificationType === "TRACK_RECORD" && (
                <div
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsVerificationModalOpen(true); } }}
                >
                  <VerificationBadge
                    expertType="TRACK_RECORD"
                    className="h-6 group-hover:bg-purple-500/20 transition-colors"
                    iconClassName="w-4 h-4"
                  />
                </div>
              )}

            </div>
            <p className="text-muted-foreground">@{profile.username}</p>

            {/* SEBI Registration Number Display */}
            {profile.expertVerificationType === "SEBI" && profile.verificationApplication?.sebiRegNumber && (
              <div
                className="flex items-center gap-1.5 mt-2 w-fit px-3 py-1 bg-green-500/5 border border-green-500/20 rounded-full cursor-pointer hover:bg-green-500/10 transition-colors"
                onClick={() => setIsVerificationModalOpen(true)}
              >
                <ShieldCheck className="w-3 h-3 text-green-600/80" />
                <span className="text-xs font-mono font-medium text-green-700/80 dark:text-green-400">
                  SEBI RN: {profile.verificationApplication.sebiRegNumber}
                </span>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-foreground/90 whitespace-pre-wrap max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Expertise Badges */}
          {profile.expertise && profile.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.expertise.map((badge: string) => (
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
              className="min-h-11 hover:underline disabled:cursor-default text-left"
              onClick={() => openList("FOLLOWING", "Following")}
              disabled={!isCurrentUser}
            >
              <span className="font-bold text-foreground">{profile.followingCount}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button
              className="min-h-11 hover:underline disabled:cursor-default text-left"
              onClick={() => openList("FOLLOWERS", "Followers")}
              disabled={!isCurrentUser}
            >
              <span className="font-bold text-foreground">{followersCount}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </button>
            {profile.isSubscriptionEnabled && (
              <button
                className="min-h-11 hover:underline disabled:cursor-default text-left"
                onClick={() => openList("SUBSCRIBERS", "Subscribers")}
                disabled={!isCurrentUser}
              >
                <span className="font-bold text-foreground">
                  {profile.subscribersCount || 0}
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

      <VerificationDetailsModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}