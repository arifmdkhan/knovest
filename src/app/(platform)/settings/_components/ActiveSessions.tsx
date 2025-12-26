"use client";

import { authClient } from "@/lib/auth-client";
import { Loader2, Laptop, Smartphone, Globe, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UAParser } from "ua-parser-js";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Session {
    token: string;
    userAgent?: string;
    ipAddress?: string;
    updatedAt?: string | Date;
    createdAt: string | Date;
    isCurrent?: boolean;
    expiresAt: string | Date;
}

export function ActiveSessions() {
    const { data: currentSession } = authClient.useSession();
    const { data: sessions, isPending, refetch } = useQuery({
        queryKey: ["sessions"],
        queryFn: async () => {
            const res = await authClient.listSessions();
            return (res.data || res) as Session[];
        }
    });

    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [isRevokingAll, setIsRevokingAll] = useState(false);

    const handleRevokeSession = async (token: string) => {
        setRevokingId(token);
        try {
            await authClient.revokeSession({ token });
            toast.success("Session revoked successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to revoke session");
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOtherSessions = async () => {
        setIsRevokingAll(true);
        try {
            await authClient.revokeOtherSessions();
            toast.success("All other sessions revoked");
            refetch();
        } catch (error) {
            toast.error("Failed to revoke other sessions");
        } finally {
            setIsRevokingAll(false);
        }
    };

    const processedSessions = useMemo(() => {
        const sessionList = (Array.isArray(sessions) ? sessions : []) as Session[];
        return sessionList.map((session) => {
            const parser = new UAParser(session.userAgent || "");
            const device = parser.getDevice();
            const browser = parser.getBrowser();
            const os = parser.getOS();

            return {
                ...session,
                deviceType: device.type,
                browserName: browser.name || "Unknown Browser",
                osName: `${os.name || "Unknown OS"} ${os.version || ""}`,
                isCurrent: currentSession?.session?.token === session.token || session.isCurrent
            };
        });
    }, [sessions, currentSession]);

    if (isPending) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your active sessions and devices.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>
                            You are currently logged in on these devices.
                        </CardDescription>
                    </div>
                    {processedSessions.length > 1 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isRevokingAll} className="w-full sm:w-auto">
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                    Revoke All Others
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will log you out from all other devices except this one. Are you sure you want to continue?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleRevokeOtherSessions}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isRevokingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke All"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!processedSessions.length ? (
                    <div className="text-center py-6 text-muted-foreground">
                        No active sessions found.
                    </div>
                ) : (
                    processedSessions.map((session) => (
                        <div
                            key={session.token}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-full mt-1 sm:mt-0">
                                    {session.deviceType === "mobile" || session.deviceType === "tablet" ? (
                                        <Smartphone className="w-5 h-5" />
                                    ) : (
                                        <Laptop className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-sm">{session.osName}</p>
                                        {session.isCurrent && (
                                            <Badge variant="outline" className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-200 dark:border-green-800 text-[10px] h-5 gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Current Device
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {session.browserName} • {session.ipAddress || "Unknown IP"}
                                    </p>
                                    <p className="text-xs text-muted-foreground/80">
                                        {session.isCurrent ? "Active now" : `Last active ${formatDistanceToNow(new Date(session.updatedAt || session.createdAt), { addSuffix: true })}`}
                                    </p>
                                </div>
                            </div>

                            {!session.isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive shrink-0 ml-auto sm:ml-0"
                                    onClick={() => handleRevokeSession(session.token)}
                                    disabled={revokingId === session.token || isRevokingAll}
                                >
                                    {revokingId === session.token ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2 sm:mr-0 lg:mr-2" />
                                            <span className="sm:hidden lg:inline">Revoke</span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
