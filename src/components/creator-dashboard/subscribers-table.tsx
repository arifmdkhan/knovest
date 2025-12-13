"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Subscriber {
    id: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
    subscriptionDate: Date;
}

interface SubscribersTableProps {
    subscribers: Subscriber[];
}

export function SubscribersTable({ subscribers }: SubscribersTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscribers.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="flex items-center gap-2 min-w-[200px]">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={sub.image || ""} alt={sub.name} />
                                            <AvatarFallback>{sub.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{sub.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                @{sub.username}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{sub.email}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(sub.subscriptionDate), "MMM d, yyyy")}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {subscribers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No subscribers yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
