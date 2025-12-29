import { Suspense } from "react";
import { UsersTable } from "./_components/users-table";
import { getAdminUsers } from "@/server/data/admin/get-users";
import { UsersTableSkeleton } from "./_components/users-table-skeleton";
import { SyncStreamUsersButton } from "./_components/sync-stream-users-button";

interface UsersPageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
    }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const query = params.q || "";

    const { users, totalPages } = await getAdminUsers({ page, query });

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">Manage users, roles, and permissions.</p>
                </div>
                <SyncStreamUsersButton />
            </div>

            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersTable users={users} totalPages={totalPages} currentPage={page} />
            </Suspense>
        </div>
    );
}
