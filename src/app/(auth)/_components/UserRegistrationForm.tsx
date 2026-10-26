"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Mail, AtSign } from "lucide-react";
import { useRouter } from "@/components/NavigationProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { checkUsernameAvailability } from "@/features/auth/actions/register.action";
import { usernameSchema } from "@/lib/validations/auth";
import Link from "@/components/AppLink";

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
        const check = await checkUsernameAvailability({ username: data.username });
        if (check.status === 'error') {
          form.setError("username", { message: check.message });
          toast.error(check.message);
          return;
        }
        await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: "sign-in",
          fetchOptions: {
            onSuccess: () => {
              sessionStorage.setItem("pending_reg", JSON.stringify(data));
              toast.success("Verification code sent");
              router.push(`/verify-request?email=${encodeURIComponent(data.email)}`);
            },
            onError: (ctx: any) => {
              toast.error(ctx.error.message);
            }
          }
        });
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <Card className="auth-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight"><h1>Create your account</h1></CardTitle>
        <CardDescription>Join a community that grows together.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-invalid={!!form.formState.errors.name} aria-describedby={form.formState.errors.name ? "name-error" : undefined} id="name" autoComplete="name" required className="pl-9" placeholder="Your full name" {...form.register("name")} disabled={isPending} />
            </div>
            {form.formState.errors.name && <p id="name-error" role="alert" className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-invalid={!!form.formState.errors.username} aria-describedby={form.formState.errors.username ? "username-error" : undefined} id="username" autoComplete="username" required className="pl-9" placeholder="Choose a username" {...form.register("username")} disabled={isPending} />
            </div>
            {form.formState.errors.username && <p id="username-error" role="alert" className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-invalid={!!form.formState.errors.email} aria-describedby={form.formState.errors.email ? "email-error" : undefined} id="email" type="email" autoComplete="email" required className="pl-9" placeholder="name@example.com" {...form.register("email")} disabled={isPending} />
            </div>
            {form.formState.errors.email && <p id="email-error" role="alert" className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending code…</> : "Create account"}
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