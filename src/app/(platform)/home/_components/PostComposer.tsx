"use client";

import { useState } from "react";
import { Globe, Lock, Users, Loader2, Send, UserStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MediaUploader, UploadedMedia } from "@/components/handle-media/media-uploader";
import { authClient } from "@/lib/auth-client";
import { useCreatePost } from "@/hooks/use-post";
import Link from "next/link";

export function PostComposer() {
  const { data: session } = authClient.useSession();
  const { mutate: createPost, isPending: isPosting } = useCreatePost();

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE" | "SUBSCRIBER">("PUBLIC");
  const [uploaderKey, setUploaderKey] = useState(0);

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return;

    createPost({
      content,
      visibility,
      media
    }, {
      onSuccess: () => {
        // Reset Form
        setContent("");
        setMedia([]);
        setUploaderKey(prev => prev + 1);
      }
    });
  };

  /* State for Mentions */
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Debounced search effect could be added, but for now direct call on slow typing is okay or use manual debounce
  // Since we are using server action, we should probably debounce.
  // Using a simple timeout for debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPosition(pos);

    // Check for mention trigger
    // Look for @ followed by word characters up to cursor
    // 1. Get text up to cursor
    const textUpToCursor = val.slice(0, pos);
    // 2. Find last @
    const lastAtPos = textUpToCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      // Check if there is a space before @ (or it's start of string)
      const isStartOfWord = lastAtPos === 0 || /[\s\n]/.test(textUpToCursor[lastAtPos - 1]);

      if (isStartOfWord) {
        // Get query after @
        const query = textUpToCursor.slice(lastAtPos + 1);
        // If query contains space, stop mentioning
        if (!/\s/.test(query) && query.length < 20) {
          setMentionQuery(query);
          setShowMentions(true);

          // Debounce Search
          if (searchTimeout) clearTimeout(searchTimeout);
          const timeout = setTimeout(async () => {
            if (query.length > 0) {
              const { searchUsers } = await import("@/server/actions/user");
              const users = await searchUsers(query);
              setMentionResults(users);
            } else {
              setMentionResults([]);
            }
          }, 300);
          setSearchTimeout(timeout);
          return;
        }
      }
    }

    // Fallback: close mentions
    setShowMentions(false);
    setMentionQuery(null);
  };

  const insertMention = (username: string) => {
    // Find the active mention position again to be safe
    const textUpToCursor = content.slice(0, cursorPosition);
    const lastAtPos = textUpToCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const newContent = content.slice(0, lastAtPos) + `@${username} ` + content.slice(cursorPosition);
      setContent(newContent);
      setShowMentions(false);
      // Focus back might be needed if we lost it (but clicking button keeps focus usually if prevented default, simplified here)
    }
  };

  if (!session) return null;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm relative z-10">
      <div className="flex gap-4">
        <Link href={`/profile/${session.user.username}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
          </Avatar>

        </Link>


        <div className="flex-1 space-y-4 relative">
          <div className="flex justify-between items-center">
            <Link href={`/profile/${session.user.username}`}>
              <span className="font-semibold text-sm">{session.user.name}</span>
            </Link>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-none bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC"><div className="flex items-center"><Globe className="w-3 h-3 mr-2" /> Public</div></SelectItem>
                <SelectItem value="FOLLOWERS"><div className="flex items-center"><Users className="w-3 h-3 mr-2" /> Followers</div></SelectItem>
                {/* @ts-ignore - isSubscriptionEnabled is added via auth config */}
                {session.user.isSubscriptionEnabled && (
                  <SelectItem value="SUBSCRIBER"><div className="flex items-center"><UserStar className="w-3 h-3 mr-2 text-purple-500" /> Subscribers</div></SelectItem>
                )}
                <SelectItem value="PRIVATE"><div className="flex items-center"><Lock className="w-3 h-3 mr-2" /> Private</div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Share your market analysis... (Type @ to mention)"
              className="min-h-[80px] border-none resize-none p-2 focus-visible:ring-0 text-base bg-transparent shadow-none placeholder:text-muted-foreground/70"
              value={content}
              onChange={handleContentChange}
              onKeyDown={(e) => {
                // Allow navigation if we implemented it, for now just basic text
              }}
            />

            {showMentions && mentionResults.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Suggested Users</div>
                  {mentionResults.map(user => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                      onClick={() => insertMention(user.username)}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <MediaUploader
            key={uploaderKey}
            onChange={setMedia}
            maxFiles={4}
            acceptedTypes="mixed"
          />

          <div className="flex justify-end pt-2 border-t border-border/50">
            <Button
              onClick={handleSubmit}
              disabled={isPosting || (!content && media.length === 0)}
              className="rounded-full px-6 font-semibold"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Post <Send className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}