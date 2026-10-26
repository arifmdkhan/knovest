"use client";
"use no memo";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { ConnectionUser } from "@/features/user/queries/get-connections";

interface VirtualUserListProps {
    users: ConnectionUser[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onFetchNextPage: () => void;
}

export function VirtualUserList({
    users,
    hasNextPage,
    isFetchingNextPage,
    onFetchNextPage,
}: VirtualUserListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? users.length + 1 : users.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70,
        overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const [lastItem] = [...virtualItems].reverse();

        if (!lastItem) {
            return;
        }

        if (
            lastItem.index >= users.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            onFetchNextPage();
        }
    }, [
        hasNextPage,
        onFetchNextPage,
        users.length,
        isFetchingNextPage,
        virtualItems,
    ]);

    return (
        <div className="flex-1 overflow-y-auto min-h-0" ref={parentRef}>
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualItems.map((virtualRow) => {
                    const isLoaderRow = virtualRow.index > users.length - 1;
                    const user = users[virtualRow.index];

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
                                transform: `translateY(${virtualRow.start}px)`,
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
                                        expertVerificationType={user.expertVerificationType}
                                        accountVerificationType={user.accountVerificationType}
                                    />
                                    {/* Can add Follow/Unfollow button here later */}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
