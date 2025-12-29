"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
// import { MediaModal } from "@/components/media-modal";

import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Globe,
  Users,
  Lock,
  Link as LinkIcon,
  Trash2,
  Flag,
  Share2,
  UserStar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { useToggleLike, useToggleSave, useDeletePost, useToggleRepost } from "@/hooks/use-post";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { FeedPost } from "@/types/post";
import { formatShortDistanceToNow } from "@/helper/date-formate";
import dynamic from "next/dynamic";

const ShareDialog = dynamic(() => import("@/components/share-dialog").then(mod => mod.ShareDialog), {
  ssr: false,
  loading: () => null
});

const MediaModal = dynamic(() => import("@/components/media-modal").then(mod => mod.MediaModal), {
  ssr: false,
  loading: () => null
});

interface FeedCardProps {
  post: FeedPost;
  onDelete?: (id: string) => void;
  priority?: boolean;
}

// --- Helper Components ---
const VisibilityIcon = ({ visibility }: { visibility: string }) => {
  switch (visibility) {
    case "FOLLOWERS": return <Users className="w-3 h-3 text-muted-foreground" />;
    case "PRIVATE": return <Lock className="w-3 h-3 text-muted-foreground" />;
    case "SUBSCRIBER": return <UserStar className="w-3 h-3 text-purple-500" />;
    default: return <Globe className="w-3 h-3 text-muted-foreground" />;
  }
};

const LinkifiedText = ({ text }: { text: string }) => {
  if (!text) return null;
  // Match URLs, Mentions (@username), or Hashtags (#tag)
  // Use capturing group for split to include the separators
  const regex = /((?:https?:\/\/[^\s]+)|(?:\B@[a-zA-Z0-9_]+)|(?:\B#[a-zA-Z0-9_]+))/g;
  const parts = text.split(regex);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2 text-foreground/90">
      {parts.map((part, i) => {
        if (part.match(/https?:\/\/[^\s]+/)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
              {part}
            </a>
          );
        } else if (part.match(/^\B@[a-zA-Z0-9_]+$/)) {
          const username = part.slice(1);
          return (
            <Link key={i} href={`/profile/${username}`} className="font-semibold text-blue-500 hover:underline">
              {part}
            </Link>
          )
        } else if (part.match(/^\B#[a-zA-Z0-9_]+$/)) {
          return (
            <span key={i} className="text-blue-500 font-medium">
              {part}
            </span>
          )
        }
        return part;
      })}
    </p>
  );
};

import { memo } from "react";

// ... previous imports

export const FeedCard = memo(function FeedCard({ post, onDelete, priority = false }: FeedCardProps) {
  const { data: session } = authClient.useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  // Determine if this is a repost wrapper
  const isRepost = !!post.originalPostId;
  const hasContent = !!post.content && post.content.trim().length > 0;
  // Use optional chaining for safety, though type says array
  const hasMedia = post.media && post.media.length > 0;

  // If original post is deleted, originalPostId becomes null (SetNull behavior).
  // So we detect "Ghost Reposts" by checking for empty content + empty media + no originalPostId.
  const isOrphaned = !isRepost && !hasContent && !hasMedia;

  const isOriginalDeleted = (isRepost && !post.originalPost) || isOrphaned;
  const isRepostWrapper = !!post.originalPost;
  const displayPost = isRepostWrapper ? post.originalPost! : post;

  // If currentUser is the reposter, show "You".
  const reposterName = isRepostWrapper ? (post.author.id === session?.user?.id ? "You" : post.author.name) : null;

  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();
  const { mutate: toggleSave, isPending: isSaving } = useToggleSave();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const { mutate: toggleRepost, isPending: isReposting } = useToggleRepost();

  // --- Optimistic State ---
  const [optimisticLike, setOptimisticLike] = useState({
    liked: displayPost.hasLiked,
    count: displayPost._count.likes
  });

  const [optimisticSave, setOptimisticSave] = useState(displayPost.isSaved);

  const [optimisticRepost, setOptimisticRepost] = useState({
    reposted: displayPost.isReposted,
    count: displayPost._count.other_Post || 0
  });

  // Check text length
  const isLongText = (displayPost.content?.split('\n').length || 0) > 8 || (displayPost.content?.length || 0) > 300;

  const handleLike = () => {
    if (!session) {
      toast.error("Please login to like posts");
      return;
    }
    const previousState = optimisticLike;
    const newLiked = !optimisticLike.liked;
    setOptimisticLike({ liked: newLiked, count: newLiked ? optimisticLike.count + 1 : optimisticLike.count - 1 });

    toggleLike({ postId: displayPost.id }, {
      onSuccess: (data) => setOptimisticLike({ liked: data.liked, count: data.count }),
      onError: () => setOptimisticLike(previousState)
    });
  };

  const handleSave = () => {
    if (!session) { toast.error("Please login to save posts"); return; }
    const previousState = optimisticSave;
    setOptimisticSave(!previousState);
    toggleSave({ postId: displayPost.id }, {
      onSuccess: (data) => setOptimisticSave(data.saved),
      onError: () => setOptimisticSave(previousState)
    });
  };

  const handleRepostAction = () => {
    if (!session) {
      toast.error("Please login to repost");
      return;
    }

    if (optimisticRepost.reposted) {
      // If already reposted, show dialog to remove
      setShowRepostDialog(true);
    } else {
      // Repost immediately
      performRepostToggle();
    }
  };

  const performRepostToggle = () => {
    const previousState = optimisticRepost;
    const newReposted = !optimisticRepost.reposted;

    setOptimisticRepost({
      reposted: newReposted,
      count: newReposted ? optimisticRepost.count + 1 : optimisticRepost.count - 1
    });

    // We toggle repost on the DISPLAYED post (the original content)
    toggleRepost({ postId: displayPost.id }, {
      onSuccess: (data) => {
        setOptimisticRepost({ reposted: data.reposted, count: data.count });
        setShowRepostDialog(false);
      },
      onError: () => {
        setOptimisticRepost(previousState);
        setShowRepostDialog(false);
      }
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    deletePost({ postId: post.id }, { onSuccess: () => onDelete?.(post.id) });
  };

  const handleShareClick = () => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/posts/${post.id}`);
      setShowShareDialog(true);
    }
  };

  const isOwner = session?.user?.id === post.author.id;

  return (
    <>
      <article className={cn("bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm transition-all duration-200", isRepostWrapper && "border-primary/20 bg-primary/5")}>

        {/* REPOST HEADER */}
        {isRepostWrapper && (
          <div className="px-4 pt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Repeat2 className="w-3 h-3" />
            <Link href={`profile/${post.author.username}`} className="hover:underline hover:text-foreground">
              {reposterName}
            </Link>
            <span>reshared</span>
          </div>
        )}

        {/* HEADER */}
        <div className={cn("p-4 flex justify-between items-start", isRepostWrapper && "pt-2")}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full sm:w-auto">
            <UserAvatarWithInfo
              name={displayPost.author.name}
              username={displayPost.author.username}
              image={displayPost.author.image}
              expertVerificationType={displayPost.author.expertVerificationType}
              accountVerificationType={displayPost.author.accountVerificationType}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-3 ml-13 sm:ml-0 sm:mt-0">
              <span>•</span>
              <span>{formatShortDistanceToNow(new Date(displayPost.createdAt))}</span>
              <span>•</span>
              <VisibilityIcon visibility={displayPost.visibility} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="More options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={handleShareClick}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleShareClick}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="cursor-pointer text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwner && (
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <Flag className="w-4 h-4 mr-2" /> Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* CONTENT */}
        {isOriginalDeleted ? (
          <div className="px-4 py-8 mx-4 mb-4 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
            <div className="p-3 bg-muted/50 rounded-full">
              <Trash2 className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Original post deleted</p>
              <p className="text-xs text-muted-foreground/60">This content is no longer available as it was deleted by the author.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pb-2">
              <div className={cn("relative", !isExpanded && isLongText && "max-h-[16em] overflow-hidden mask-fade-bottom")}>
                <LinkifiedText text={displayPost.content || ""} />
              </div>
              {isLongText && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-medium text-muted-foreground hover:text-primary mt-1">
                  {isExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {/* MEDIA GRID */}
            {displayPost.media.length > 0 && (
              <div className={cn(
                "grid gap-0.5 overflow-hidden mt-3",
                displayPost.media.length === 1 && "grid-cols-1",
                displayPost.media.length === 2 && "grid-cols-2",
                displayPost.media.length >= 3 && "grid-cols-2",
              )}>
                {displayPost.media.map((media, idx) => {
                  const isFeatured = displayPost.media.length === 3 && idx === 0;
                  return (
                    <div key={media.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMedia({ url: media.url, type: media.type }); }} className={cn("relative bg-muted/30 cursor-pointer overflow-hidden group/media", isFeatured ? "row-span-2 aspect-[4/5]" : "aspect-square", displayPost.media.length === 1 && "aspect-video max-h-[500px]")}>
                      {media.type === 'IMAGE' ? (
                        <SafeImage
                          src={media.url}
                          alt={`Post image ${idx + 1}`}
                          fill
                          quality={95}
                          className="object-cover transition-transform duration-500 group-hover/media:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 60vw"
                          priority={priority && idx === 0}
                        />
                      ) : (
                        <video src={media.url} className="w-full h-full object-cover" controls preload="metadata" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* FOOTER */}
        {!isOriginalDeleted && (
          <div className="p-3 flex items-center justify-between border-t border-border/50 mt-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleLike} className={cn("group px-2 h-9 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95", optimisticLike.liked ? "text-red-500" : "text-muted-foreground")} aria-label={optimisticLike.liked ? "Unlike post" : "Like post"}>
                <Heart className={cn("w-5 h-5 mr-1.5 transition-transform group-hover:scale-110", optimisticLike.liked && "fill-current scale-110")} />
                <span className="text-sm font-medium tabular-nums">{optimisticLike.count > 0 ? optimisticLike.count : ""}</span>
              </Button>

              <Link href={`/posts/${displayPost.id}`} aria-label={`${displayPost._count.comments} Comments`}>
                <Button variant="ghost" size="sm" className="group px-2 h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-95" aria-hidden="true">
                  <MessageCircle className="w-5 h-5 mr-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium tabular-nums">{displayPost._count.comments > 0 ? displayPost._count.comments : ""}</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepostAction}
                className={cn(
                  "group px-2 h-9 rounded-full transition-all active:scale-95",
                  optimisticRepost.reposted
                    ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                )}
                aria-label="Repost"
              >
                <Repeat2 className={cn("w-5 h-5 mr-1.5 transition-transform group-hover:rotate-180", optimisticRepost.reposted && "fill-current scale-110")} />
                <span className="text-sm font-medium tabular-nums">{optimisticRepost.count > 0 ? optimisticRepost.count : ""}</span>
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} className={cn("h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95", optimisticSave ? "text-primary fill-primary" : "text-muted-foreground")} aria-label={optimisticSave ? "Unsave post" : "Save post"}>
              <Bookmark className={cn("w-5 h-5", optimisticSave && "fill-current")} />
            </Button>
          </div>
        )}

      </article>

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently remove your post.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showRepostDialog && (
        <AlertDialog open={showRepostDialog} onOpenChange={setShowRepostDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Repost?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this repost? It will be removed from your profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performRepostToggle} className="bg-destructive hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          onOpenChange={setShowShareDialog}
          url={shareUrl}
        />
      )}

      <MediaModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        media={selectedMedia}
      />
    </>
  );
});