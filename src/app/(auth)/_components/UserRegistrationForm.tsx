"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, User, Mail, AtSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { authClient } from "@/lib/auth-client";
import { checkUsernameAvailability } from "@/server/actions/register";
import { usernameSchema } from "@/lib/validations/auth";
import Link from "next/link";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: usernameSchema.shape.username,
  email: z.string().email("Invalid email address"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      try {
        // 1. Check Username
        const check = await checkUsernameAvailability(data.username);
        if (check.status === 'error') {
          form.setError("username", { message: check.message });
          toast.error(check.message);
          return;
        }

        // 2. Send OTP
        const res = await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: "sign-in", // This initiates the flow
          fetchOptions: {
            onSuccess: () => {
              // Store details to apply after verification
              sessionStorage.setItem("pending_reg", JSON.stringify(data));
              toast.success("Verification code sent");
              router.push(`/verify-request?email=${encodeURIComponent(data.email)}`);
            },
            onError: (ctx) => {
              toast.error(ctx.error.message);
            }
          }
        });
      } catch (error) {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <Card className="w-full max-w-md border-border/50 shadow-xl bg-card/50 backdrop-blur-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
        <CardDescription>Join the Consensus network</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="John Doe" {...form.register("name")} disabled={isPending} />
            </div>
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="username" {...form.register("username")} disabled={isPending} />
            </div>
            {form.formState.errors.username && <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="name@example.com" {...form.register("email")} disabled={isPending} />
            </div>
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t bg-muted/20 py-4">
        <div className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </CardFooter>
    </Card>
  );
}