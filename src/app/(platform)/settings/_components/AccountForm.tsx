"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "@/components/NavigationProvider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { checkUsernameAvailability } from "@/features/auth/actions/register.action";

interface User {
    id: string;
    name?: string | null;
    username?: string | null;
    displayUsername?: string | null;
    image?: string | null;
}

const accountFormSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters." })
        .max(30, { message: "Username must not be longer than 30 characters." })
        .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
    user: User;
}

export function AccountForm({ user }: AccountFormProps) {
    const router = useRouter();
    const { refetch: refreshSession } = authClient.useSession();
    const [savedUsername, setSavedUsername] = useState(user.username || "");
    const [isPending, startTransition] = useTransition();
    const [usernameAvailability, setUsernameAvailability] = useState<{
        status: "idle" | "loading" | "available" | "taken" | "error";
        message?: string;
    }>({ status: "idle" });

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            username: user.displayUsername || user.username || "",
            name: user.name || "",
        },
        mode: "onChange",
    });

    const watchedUsername = form.watch("username");

    useEffect(() => {
        let cancelled = false;
        if (form.getFieldState("username").error?.type === "availability") form.clearErrors("username");
        setUsernameAvailability({ status: "idle" });
        if (!watchedUsername || watchedUsername.toLowerCase() === savedUsername.toLowerCase()
            || !accountFormSchema.shape.username.safeParse(watchedUsername).success) return;

        const timer = setTimeout(async () => {
            setUsernameAvailability({ status: "loading" });
            try {
                const result = await checkUsernameAvailability({ username: watchedUsername });
                if (cancelled) return;
                if (result.status === "success") {
                    setUsernameAvailability({ status: "available", message: "Username is available" });
                } else if (result.message === "Username is already taken") {
                    setUsernameAvailability({ status: "taken", message: result.message });
                    form.setError("username", { type: "availability", message: result.message });
                } else {
                    setUsernameAvailability({ status: "error", message: "Could not check availability. You can still save." });
                }
            } catch {
                if (!cancelled) setUsernameAvailability({ status: "error", message: "Could not check availability. You can still save." });
            }
        }, 500);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [watchedUsername, savedUsername, form]);

    function onSubmit(data: AccountFormValues) {
        if (usernameAvailability.status === "taken") {
            form.setError("username", { type: "manual", message: "Username is taken" });
            return;
        }

        startTransition(async () => {
            try {
                // Use wrapper action to ensure Stream sync
                const { updateAccountSettings } = await import("@/features/user/user.action");
                const res = await updateAccountSettings({
                    name: data.name,
                    username: data.username,
                });

                if (res.status === "error") {
                    toast.error(res.message || "Failed to update profile");
                    return;
                }
                setSavedUsername(res.data!.username);
                form.reset({ name: res.data!.name, username: res.data!.username });
                setUsernameAvailability({ status: "idle" });
                await refreshSession({ query: { disableCookieCache: true } });

                toast.success("Profile updated successfully");
                router.refresh(); // Refresh server components

            } catch  {
                toast.error("An error occurred");
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                    Update your public profile information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your name" disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is the name that will be displayed on your profile and in emails.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="username" disabled={isPending} {...field} />
                                            <div className="absolute right-3 top-2.5 h-4 w-4">
                                                {usernameAvailability.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                                {usernameAvailability.status === "error" && <span className="block mt-1 text-xs">{usernameAvailability.message}</span>}
                                        {usernameAvailability.status === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                {usernameAvailability.status === "taken" && <XCircle className="h-4 w-4 text-destructive" />}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        This is your public display name. It can be your real name or a pseudonym.
                                        {usernameAvailability.status === "error" && <span className="block mt-1 text-xs">{usernameAvailability.message}</span>}
                                        {usernameAvailability.status === "available" && <span className="text-green-600 block mt-1 text-xs">Username is available!</span>}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isPending || usernameAvailability.status === "loading" || usernameAvailability.status === "taken"}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Account
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
