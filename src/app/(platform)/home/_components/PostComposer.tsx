"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ConnectionUser } from "@/features/user/queries/get-connections";
import { Globe, Lock, Users, Loader2, Send, UserStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { MediaUploader, UploadedMedia } from "@/components/handle-media/media-uploader";
import { UploadIntent } from "@/lib/storage/types";
import { authClient } from "@/lib/auth-client";
import { useCreatePost } from "@/hooks/use-post";
import Link from "@/components/AppLink";

export function PostComposer() {
  const { data: session } = authClient.useSession();
  const { mutate: createPost, isPending: isPosting } = useCreatePost();

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE" | "SUBSCRIBER">("PUBLIC");
  const [postId, setPostId] = useState<string>(() => crypto.randomUUID());

  const [uploaderKey, setUploaderKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return;

    createPost({
      id: postId,
      content,
      visibility,
      media: media
        ? media
          .filter((m) => m.type === "IMAGE" || m.type === "VIDEO")
          .map((m) => ({
            url: m.url,
            key: m.key,
            type: m.type as "IMAGE" | "VIDEO",
            width: (m as any).width,
            height: (m as any).height,
          }))
        : undefined
    }, {
      onSuccess: () => {
        // Reset Form
        setContent("");
        setMedia([]);
        setUploaderKey(prev => prev + 1);
        setPostId(crypto.randomUUID()); // New ID for next post
      }
    });
  };

  /* State for Mentions */
  const [mentionResults, setMentionResults] = useState<ConnectionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentionQueryRef = useRef("");
  useEffect(() => () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); mentionQueryRef.current = ""; }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    mentionQueryRef.current = "";
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPosition(pos);
    const textUpToCursor = val.slice(0, pos);
    const lastAtPos = textUpToCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      // Check if there is a space before @ 
      const isStartOfWord = lastAtPos === 0 || /[\s\n]/.test(textUpToCursor[lastAtPos - 1]);

      if (isStartOfWord) {
        // Get query after @
        const query = textUpToCursor.slice(lastAtPos + 1);
        // If query contains space, stop mentioning
        if (!/\s/.test(query) && query.length < 20) {
          mentionQueryRef.current = query;
          setShowMentions(true);

          // Debounce Search
          searchTimeout.current = setTimeout(async () => {
            if (query.length > 0) {
              const { searchUsers } = await import("@/features/user/user.action");
              // searchUsers returns correct shape matching ConnectionUser mostly
              const res = await searchUsers({ query });
              if (mentionQueryRef.current !== query) return;
              if (res.status === "success" && res.data) {
                setMentionResults(res.data as ConnectionUser[]);
              } else {
                setMentionResults([]);
              }
            } else {
              setMentionResults([]);
            }
          }, 300);
          return;
        }
      }
    }
    setShowMentions(false);
    mentionQueryRef.current = "";
  };

  const insertMention = (username: string) => {
    const textUpToCursor = content.slice(0, cursorPosition);
    const lastAtPos = textUpToCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const newContent = content.slice(0, lastAtPos) + `@${username} ` + content.slice(cursorPosition);
      setContent(newContent);
      setShowMentions(false);
    }
  };

  const uploadParams = useMemo(() => ({ postId }), [postId]);
  const allowedTypes = useMemo<("image" | "video")[]>(() => ["image", "video"], []);

  if (!session) return null;

  const user = session.user as typeof session.user & {
    username: string;
    isSubscriptionEnabled: boolean
  };

  return (
    <div className="app-panel post-composer relative z-10 w-full p-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user.username}`} className="shrink-0" aria-label="Your profile">
          <Avatar className="size-10"><AvatarImage src={user.image || ""} alt={user.name} /><AvatarFallback>{user.name?.charAt(0)}</AvatarFallback></Avatar>
        </Link>
        <div className="relative min-w-0 flex-1">
          <Textarea aria-label="Share a post" placeholder="Share your market analysis, ideas or questions…" rows={1}
            className="composer-input min-h-[52px] w-full resize-none rounded-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            value={content} onChange={handleContentChange} disabled={isPosting} />
          {showMentions && mentionResults.length > 0 && <div className="absolute top-full left-0 z-50 mt-2 w-64 max-w-full overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Suggested people</p>
            {mentionResults.map(person => <button key={person.id} type="button" className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => insertMention(person.username || "")}>
              <Avatar className="size-7"><AvatarImage src={person.image || undefined} alt="" /><AvatarFallback>{person.name?.[0]}</AvatarFallback></Avatar>
              <span className="min-w-0"><span className="block truncate font-medium">{person.name}</span><span className="block truncate text-xs text-muted-foreground">@{person.username}</span></span>
            </button>)}
          </div>}
        </div>
        <Select value={visibility} onValueChange={(value: typeof visibility) => setVisibility(value)} disabled={isPosting}>
          <SelectTrigger aria-label={`Post visibility: ${visibility.toLowerCase()}`} className="composer-visibility w-[116px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC"><Globe className="size-3.5" /><span className="composer-option-label">Public</span></SelectItem>
            <SelectItem value="FOLLOWERS"><Users className="size-3.5" /><span className="composer-option-label">Followers</span></SelectItem>
            {user.isSubscriptionEnabled && <SelectItem value="SUBSCRIBER"><UserStar className="size-3.5" /><span className="composer-option-label">Subscribers</span></SelectItem>}
            <SelectItem value="PRIVATE"><Lock className="size-3.5" /><span className="composer-option-label">Private</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MediaUploader key={uploaderKey} variant="compact" className="mt-3" onChange={setMedia} existingMedia={media} maxFiles={4} allowedTypes={allowedTypes} maxSizeMB={30} intent={UploadIntent.POST_MEDIA} uploadParams={uploadParams} disabled={isPosting} onUploadingChange={setIsUploading}
        footerAction={<Button onClick={handleSubmit} disabled={isPosting || isUploading || (!content.trim() && media.length === 0)} className="rounded-full px-5 font-medium">{isPosting ? <><Loader2 className="size-4 animate-spin" />Posting…</> : <>Post<Send className="size-4" /></>}</Button>} />
    </div>
  );
}
