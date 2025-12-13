"use client";

import { useState, useEffect, memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChannelPreviewUIComponentProps, useChatContext } from "stream-chat-react";
import { Users, Check, CheckCheck, Camera, File, Mic, Image as ImageIcon, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StreamChatGenerics, CustomChannelData } from "@/lib/chat-types";
import { Event } from "stream-chat";

interface CustomPreviewProps extends ChannelPreviewUIComponentProps {
  onSelect: () => void;
  active: boolean;
}

export const ChannelPreview = memo(function ChannelPreview({
  channel,
  active,
  displayTitle,
  latestMessage,
  unread,
  onSelect
}: CustomPreviewProps) {
  const { client } = useChatContext();
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState(channel.id);

  if (channel.id !== currentChannelId) {
    setCurrentChannelId(channel.id);
    setIsTyping(false);
    setTypingUsers([]);
  }

  const unreadCount = unread || 0;
  // Determine if it's a group based on member count or explicit name
  const memberCount = channel.data?.member_count || 0;
  const isGroup = memberCount > 2 || !!(channel.data as CustomChannelData)?.name;
  const isSubscriptionGroup = (channel.data as any)?.isSubscriptionGroup || channel.id?.startsWith('subscription-group-');

  // Robustly get the latest message - Prioritize channel state which is often more complete
  const message = (channel.lastMessage() || latestMessage || channel.state.messages[channel.state.messages.length - 1]) as unknown as StreamChatGenerics['messageType'] | undefined;

  useEffect(() => {
    const handleTypingStart = (event: Event) => {
      if (!event.user) return;
      if (event.user.id !== client.userID) {
        setTypingUsers((prev) => {
          const name = event.user?.name || event.user?.id || "Unknown";
          if (!prev.includes(name)) return [...prev, name];
          return prev;
        });
        setIsTyping(true);
      }
    };

    const handleTypingStop = (event: Event) => {
      if (!event.user) return;
      const name = event.user.name || event.user.id || "Unknown";
      setTypingUsers((prev) => prev.filter((u) => u !== name));
      setIsTyping((prev) => prev); // Simplified, just trigger re-render if needed
    };

    channel.on("typing.start", handleTypingStart);
    channel.on("typing.stop", handleTypingStop);

    return () => {
      channel.off("typing.start", handleTypingStart);
      channel.off("typing.stop", handleTypingStop);
    };
  }, [channel, client.userID]);




  const getPreviewContent = () => {
    if (typingUsers.length > 0) {
      const text = typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.length} people are typing...`;
      return <span className="text-primary font-medium text-xs animate-pulse tracking-wide">{text}</span>;
    }

    if (!message) return <span className="text-muted-foreground/60 text-sm italic">No messages yet</span>;

    if (message.deleted_at) {
      return <span className="text-muted-foreground/60 italic text-sm">Message deleted</span>;
    }

    const isMyMessage = message?.user?.id === client.userID;

    // Improved Text Extraction:
    let textContent = message.text || "";
    if (!textContent && message.html) {
      // Strip HTML tags to show plain text preview
      textContent = message.html.replace(/<[^>]*>?/gm, '');
    }

    const hasAttachments = message.attachments && message.attachments.length > 0;

    let content = null;

    if (textContent.trim()) {
      content = <span className={cn("text-muted-foreground/80 truncate text-sm transition-colors", unreadCount > 0 && "font-semibold text-foreground")}>{textContent}</span>;
    } else if (message.command) {
      // Handle slash commands like /giphy
      content = <span className="text-muted-foreground/80 text-sm italic">Command: /{message.command}</span>;
    } else if (hasAttachments) {
      const type = message.attachments![0].type;
      if (type === 'image') {
        content = <span className="flex items-center gap-1.5 text-muted-foreground/80 text-sm"><Camera className="w-3.5 h-3.5" /> Photo</span>;
      } else if (type === 'video') {
        content = <span className="flex items-center gap-1.5 text-muted-foreground/80 text-sm"><ImageIcon className="w-3.5 h-3.5" /> Video</span>;
      } else if (type === 'audio') {
        content = <span className="flex items-center gap-1.5 text-muted-foreground/80 text-sm"><Mic className="w-3.5 h-3.5" /> Audio</span>;
      } else {
        content = <span className="flex items-center gap-1.5 text-muted-foreground/80 text-sm"><File className="w-3.5 h-3.5" /> File</span>;
      }
    } else {
      // Fallback for system messages or unknown types
      const fallbackText = message.type === 'system' ? 'System Notification' : 'Message';
      content = <span className="text-muted-foreground/80 text-sm italic">{fallbackText}</span>;
    }

    if (isGroup && message.user?.name && !isMyMessage) {
      return <div className="flex items-center gap-1 truncate text-sm">
        <span className="font-semibold text-foreground/70 shrink-0">{message.user.name.split(' ')[0]}:</span>
        {content}
      </div>;
    }

    return <div className="flex items-center gap-1.5 truncate text-sm">
      {isMyMessage && (
        <span className="shrink-0 text-muted-foreground/70">
          {message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Check className="w-3.5 h-3.5" />}
        </span>
      )}
      {content}
    </div>;
  };

  const formatTime = (dateStr: string | Date | undefined) => {
    const targetDate = dateStr || channel.data?.last_message_at;
    if (!targetDate) return "";

    const date = new Date(targetDate);
    const now = new Date();

    if (isNaN(date.getTime())) return "";

    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getDisplayImage = () => {
    if ((channel.data as CustomChannelData)?.image) return (channel.data as CustomChannelData).image;

    const members = Object.values(channel.state.members);
    const otherMembers = members.filter((m) => m.user_id !== client.userID);

    if (otherMembers.length === 1) {
      return otherMembers[0].user?.image || "";
    }
    return "";
  };

  const title = displayTitle || (channel.data as CustomChannelData)?.name || (isGroup ? "Group Chat" : "Untitled Chat");

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200 text-left relative group my-1",
        active
          ? "bg-linear-to-r from-primary/25 to-primary/5 shadow-md ring-1 ring-primary/20 border-l-4 border-primary"
          : "hover:bg-background/60 hover:shadow-sm hover:ring-1 hover:ring-border/30 border-l-4 border-transparent"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="w-12 h-12 ring-2 ring-border/20 transition-all duration-300 group-hover:ring-border/40">
          <AvatarImage src={getDisplayImage()} className="object-cover" />
          <AvatarFallback className="bg-linear-to-br from-primary/10 to-primary/5 text-primary font-bold text-lg">
            {title.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {isGroup && (
          <div className="absolute -bottom-1 -right-1">
            <div className="bg-background rounded-full p-0.5">
              {isSubscriptionGroup ? (
                <div className="bg-yellow-500/90 text-white rounded-full p-1 shadow-sm ring-1 ring-yellow-400/50">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                </div>
              ) : (
                <div className="bg-primary/90 text-primary-foreground rounded-full p-1 shadow-sm">
                  <Users className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex justify-between items-center">
          <span className={cn("text-sm font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors", unreadCount > 0 && "text-foreground")}>
            {title}
          </span>
          <span className={cn("text-[11px] shrink-0 ml-2 font-medium tabular-nums", unreadCount > 0 ? "text-primary" : "text-muted-foreground/60")}>
            {formatTime(message?.created_at as string | Date)}
          </span>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            {getPreviewContent()}
          </div>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0 shadow-sm mt-0.5"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
});