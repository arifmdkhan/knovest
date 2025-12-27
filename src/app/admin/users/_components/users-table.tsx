"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, Ban, CheckCircle, Search, ChevronLeft, ChevronRight, LogOut, Trash2, RefreshCw, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Role, AccountVerificationType } from "@/generated/prisma/client";
import { banUser, unbanUser, updateUserRole, revokeUserSessions, removeUser, updateAccountVerification } from "@/server/actions/admin";
import { restoreStreamUsers } from "@/server/actions/stream";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";


interface AdminUser {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: Role;
    banned: boolean | null;
    createdAt: Date;
    username: string | null;
    expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
}

interface UsersTableProps {
    users: AdminUser[];
    totalPages: number;
    currentPage: number;
}

export function UsersTable({ users, totalPages, currentPage }: UsersTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

    // ... (useEffect same)

    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams.get("q") || "";
            if (searchQuery !== currentQ) {
                const params = new URLSearchParams(searchParams);
                if (searchQuery) {
                    params.set("q", searchQuery);
                } else {
                    params.delete("q");
                }
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, router, pathname, searchParams]);


    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleBan = async (userId: string) => {
        setIsLoading(userId);
        const res = await banUser(userId, "Admin action");
        setIsLoading(null);
        if (res.status === "success") {
            toast.success("User banned successfully");
            router.refresh();
        } else {
            toast.error("Failed to ban user");
        }
    };

    const handleUnban = async (userId: string) => {
        setIsLoading(userId);
        const res = await unbanUser(userId);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success("User unbanned successfully");
            router.refresh();
        } else {
            toast.error("Failed to unban user");
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        setIsLoading(userId);
        const res = await updateUserRole(userId, newRole);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success(`Role updated to ${newRole}`);
            router.refresh();
        } else {
            toast.error("Failed to update role");
        }
    };

    const handleRevokeSessions = async (userId: string) => {
        setIsLoading(userId);
        const res = await revokeUserSessions(userId);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success("User sessions revoked");
            router.refresh();
        } else {
            toast.error("Failed to revoke sessions");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        setIsLoading(userId);
        const res = await removeUser(userId);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success("User deleted successfully");
            router.refresh();
        } else {
            toast.error("Failed to delete user");
        }
    };

    // We removed manual toggling of individual verification bits in favor of updating the Type, 
    // but the server action for that is not yet refactored. 
    // For now, removing the broken verification toggle menu items.

    const handleRestoreStreamUser = async (userId: string) => {
        setIsLoading(userId);
        const res = await restoreStreamUsers([userId]);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success("Stream user restored successfully");
        } else {
            toast.error("Failed to restore stream user");
        }
    };

    const handleVerificationChange = async (userId: string, type: AccountVerificationType) => {
        setIsLoading(userId);
        const res = await updateAccountVerification(userId, type);
        setIsLoading(null);
        if (res.status === "success") {
            toast.success(`Verification updated to ${type}`);
            router.refresh();
        } else {
            toast.error(res.message || "Failed to update verification");
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar - SAME */}
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <UserAvatarWithInfo
                                            name={user.name}
                                            username={user.username || "user"}
                                            image={user.image}
                                            expertVerificationType={user.expertVerificationType}
                                            accountVerificationType={user.accountVerificationType}
                                        />
                                    </TableCell>
                                    <TableCell className="text-sm">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "destructive" : "secondary"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.banned ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Role</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "USER")}>
                                                    Set as User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "ADMIN")}>
                                                    <Shield className="mr-2 h-4 w-4" /> Set as Admin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "SUPER_ADMIN")}>
                                                    <Shield className="mr-2 h-4 w-4 text-red-500" /> Set as Super Admin
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.banned ? (
                                                    <DropdownMenuItem onClick={() => handleUnban(user.id)} className="text-green-600">
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Unban User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleBan(user.id)} className="text-destructive">
                                                        <Ban className="mr-2 h-4 w-4" /> Ban User
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />

                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Verification</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleVerificationChange(user.id, "OFFICIAL")}>
                                                    <BadgeCheck className="mr-2 h-4 w-4 text-yellow-500" /> Set Official
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleVerificationChange(user.id, "VERIFIED_USER")}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" /> Set Verified
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleVerificationChange(user.id, "NONE")}>
                                                    Remove Verification
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                                                    <LogOut className="mr-2 h-4 w-4" /> Revoke Sessions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRestoreStreamUser(user.id)}>
                                                    <RefreshCw className="mr-2 h-4 w-4" /> Restore Stream User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div >
        </div >
    );
}
