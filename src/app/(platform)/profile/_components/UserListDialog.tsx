"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConnections } from "@/hooks/use-connections";
import { ConnectionType } from "@/features/user/queries/get-connections";
import { VirtualUserList } from "./VirtualUserList";


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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <VirtualUserList
                    users={allUsers}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onFetchNextPage={fetchNextPage}
                />
            </DialogContent>
        </Dialog>
    );
}
