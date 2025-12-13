"use client";

import { useEffect, useRef, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { useConnections } from "@/hooks/use-connections";
import { ConnectionType } from "@/app/data/user/get-connections";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UserListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: ConnectionType;
    title: string;
}

export function UserListDialog({ isOpen, onClose, userId, type, title }: UserListDialogProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error
    } = useConnections(userId, type, isOpen);

    const allUsers = useMemo(() => {
        return data?.pages.flatMap((page) => page.items) || [];
    }, [data]);

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useWindowVirtualizer({
        count: hasNextPage ? allUsers.length + 1 : allUsers.length,
        estimateSize: () => 70, // Estimate item height
        overscan: 5,
        scrollMargin: parentRef.current?.offsetTop ?? 0,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const [lastItem] = [...virtualItems].reverse();

        if (!lastItem) {
            return;
        }

        if (
            lastItem.index >= allUsers.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage();
        }
    }, [
        hasNextPage,
        fetchNextPage,
        allUsers.length,
        isFetchingNextPage,
        virtualItems,
    ]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0" ref={parentRef}>
                    {status === 'pending' && (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-8 text-center text-red-500">
                            {error?.message || "Failed to load users"}
                        </div>
                    )}

                    {status === 'success' && allUsers.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No users found.
                        </div>
                    )}

                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualItems.map((virtualRow) => {
                            const isLoaderRow = virtualRow.index > allUsers.length - 1;
                            const user = allUsers[virtualRow.index];

                            return (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                                    }}
                                >
                                    {isLoaderRow ? (
                                        <div className="h-16 flex items-center justify-center">
                                            {isFetchingNextPage && (
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <UserAvatarWithInfo
                                                name={user.name}
                                                username={user.username}
                                                image={user.image}
                                                isVerified={user.isVerified}
                                                isSebiVerified={user.isSebiVerified}
                                            />
                                            {/* Can add Follow/Unfollow button here later */}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
