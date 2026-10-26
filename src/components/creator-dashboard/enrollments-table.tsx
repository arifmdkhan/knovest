"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Enrollment {
    id: string;
    userId: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
    courseName: string;
    enrollmentDate: Date;
}

interface EnrollmentsTableProps {
    enrollments: Enrollment[];
}

export function EnrollmentsTable({ enrollments }: EnrollmentsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Enrolled</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                    <TableCell className="flex items-center gap-2 min-w-[200px]">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={enrollment.image || ""} alt={enrollment.name} />
                                            <AvatarFallback>{enrollment.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{enrollment.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                @{enrollment.username}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium min-w-[150px]">{enrollment.courseName}</TableCell>
                                    <TableCell>{enrollment.email}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(enrollment.enrollmentDate), "MMM d, yyyy")}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {enrollments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No enrollments yet.
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
