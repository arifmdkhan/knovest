"use client";

import { useTransition, useState } from "react"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Mail } from "lucide-react"; 
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { IconBrandGoogle } from "@tabler/icons-react";
import { checkUserExists } from "@/server/actions/check-user-exist";

// Zod Schema for Email
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/home', 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to Google";
      toast.error(errorMessage);
      setIsGoogleLoading(false);
    }
  }

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      try {
        const check = await checkUserExists(data.email);
        if (check.status === "error") {
          toast.error("Account not found. Please register first.");
          return;
        }
        await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: "sign-in",
          fetchOptions: {
            onSuccess: () => {
              toast.success("Verification code sent");
              // Redirect to the existing verification page
              router.push(`/verify-request?email=${encodeURIComponent(data.email)}`);
            },
            onError: (ctx) => {
              toast.error(ctx.error.message || "Failed to send OTP");
            }
          }
        });
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <Card className="w-full max-w-md border-border/50 shadow-xl bg-card/50 backdrop-blur-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                {...form.register("email")}
                disabled={isPending || isGoogleLoading}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive font-medium">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={isPending || isGoogleLoading}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              <>
                Continue with Email <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center gap-4 py-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground uppercase">Or</span>
            <Separator className="flex-1" />
        </div>

        <div className="flex items-center justify-center">
          <Button
            disabled={isGoogleLoading || isPending}
            onClick={signInWithGoogle}
            variant="outline" 
            type="button"
            className="w-full"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <IconBrandGoogle className="mr-2 h-4 w-4" />
                Login with Google
              </>
            )}
          </Button>
        </div>

      </CardContent>
      <CardFooter className="flex justify-center border-t bg-muted/20 py-4">
        <div className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}