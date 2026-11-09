"use client";

import Link from "@/components/AppLink";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toggleFollow } from "@/features/user/user.action";
import { toast } from "sonner";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface Suggestion {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
  accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
}

export function FollowSuggestionsSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FollowSuggestions({ users }: { users: Suggestion[] }) {
  if (users.length === 0) {
    return (
      <Card className="p-5 gap-4">
        <h2 className="text-base font-semibold">Who to follow</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">You’re up to date. Discover people and fresh perspectives in search.</p>
        <Link href="/search" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Explore the community →</Link>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md">
      <h2 className="font-semibold text-base">Who to follow</h2>
      <div className="space-y-4">
        {users.map((user) => (
          <SuggestionItem key={user.id} user={user} />
        ))}
      </div>
    </Card>
  );
}

function SuggestionItem({ user }: { user: Suggestion }) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    // Optimistic updates
    setIsFollowing(true);

    try {
      const result = await toggleFollow({ targetUserId: user.id });
      if (result.status === "error") throw new Error(result.message);

      if (result.data) {
        setIsFollowing(result.data.isFollowing);
        void queryClient.invalidateQueries();
      }
    } catch  {
      setIsFollowing(false); // Revert following.
      toast.error("Failed to follow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <UserAvatarWithInfo
        name={user.name}
        username={user.username}
        image={user.image}
        expertVerificationType={user.expertVerificationType}
        accountVerificationType={user.accountVerificationType}
        className="flex-1 min-w-0"
      />

      <Button
        size="sm"
        variant={isFollowing ? "outline" : "secondary"}
        className={`h-8 px-3 rounded-full text-xs font-medium transition-all ${isFollowing ? "text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        onClick={handleFollow}
        disabled={isLoading}
        aria-label={isFollowing ? `Unfollow ${user.name}` : `Follow ${user.name}`}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isFollowing ? (
          "Following"
        ) : (
          "Follow"
        )}
      </Button>
    </div>
  );
}
