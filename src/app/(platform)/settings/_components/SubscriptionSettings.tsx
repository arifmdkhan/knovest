"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateSubscriptionSettings } from "@/features/subscriptions/actions/update-subscription-settings.action";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@/generated/prisma/client";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
    isSubscriptionEnabled: z.boolean(),
    subscriptionPrice: z.coerce.number().min(0, "Price must be positive"),
});

interface SubscriptionSettingsProps {
    user: User;
}

export function SubscriptionSettings({ user }: SubscriptionSettingsProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            isSubscriptionEnabled: !!user.isSubscriptionEnabled,
            subscriptionPrice: Number(user.subscriptionPrice ?? 0),
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const res = await updateSubscriptionSettings(values);
            if (res.status === "success") {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        });
    }

    if (user.expertVerificationType !== "SEBI") {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Settings</CardTitle>
                <CardDescription>
                    Manage your subscription settings. Enable subscriptions to allow users to subscribe to your content.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="isSubscriptionEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Enable Subscriptions</FormLabel>
                                        <FormDescription>
                                            Allow users to subscribe to your profile.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {form.watch("isSubscriptionEnabled") && (
                            <FormField
                                control={form.control}
                                name="subscriptionPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Subscription Price (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Set the monthly price for your subscription in Rupees.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
