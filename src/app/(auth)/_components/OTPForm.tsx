"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/components/NavigationProvider";
import { toast } from "sonner";
import { Loader2, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { updateProfileAfterLogin } from "@/features/auth/actions/register.action";

export function OTPForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");

  const [otp, setOtp] = useState("");
  const [isPending, startTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(
      () => setTimeLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const verifyOtp = () => {
    if (!email) return;

    startTransition(async () => {
      try {
        const result = await authClient.signIn.emailOtp({ email, otp });
        if (result.error) {
          toast.error(result.error.message || "Invalid OTP");
          return;
        }
        // Auth changes the server session. Start a fresh document after the
        // response completes so prefetched anonymous routes cannot be reused.
        let destination = "/home";
        try {
          const pendingReg = sessionStorage.getItem("pending_reg");
          if (pendingReg) {
            const draft: unknown = JSON.parse(pendingReg);
            if (draft && typeof draft === "object" && "email" in draft && draft.email === email && "name" in draft && typeof draft.name === "string" && "username" in draft && typeof draft.username === "string") {
              const result = await updateProfileAfterLogin({ name: draft.name, username: draft.username });
              if (result.status === "error") {
                toast.error(result.message || "Finish your profile in account settings.");
                destination = "/settings/account?onboarding=1";
              }
            }
            sessionStorage.removeItem("pending_reg");
          }
        } catch {
          toast.error("You are signed in. Finish your profile in account settings.");
          destination = "/settings/account?onboarding=1";
        }

        if (destination === "/home") toast.success("Welcome!");
        window.location.replace(destination);
      } catch {
        toast.error("We couldn’t verify your code. Please try again.");
      }
    });
  };

  const handleResend = () => {
    if (!email || timeLeft > 0 || isPending) return;
    startTransition(async () => {
      try {
        const result = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        });
        if (result.error) {
          toast.error(
            result.error.message ||
              "We couldn’t send your code. Please try again.",
          );
          return;
        }
        setOtp("");
        setTimeLeft(30);
        toast.success("A new verification code has been sent.");
      } catch {
        toast.error("We couldn’t send your code. Please try again.");
      }
    });
  };

  if (!email || !email.includes("@")) return <Card className="auth-card"><CardHeader><CardTitle><h1>Start a new sign-in request</h1></CardTitle><CardDescription>Enter your email first so we can send you a verification code.</CardDescription></CardHeader><CardContent><Button onClick={() => router.push("/login")}>Return to sign in</Button></CardContent></Card>;

  return (
    <Card className="auth-card">
      <CardHeader className="text-center">
        <CardTitle><h1>Verify your email</h1></CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to
          <br />
          <span className="font-medium text-foreground break-all">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <InputOTP
          aria-label="Email verification code"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={otp}
          onChange={setOtp}
          maxLength={6}
          disabled={isPending}
        >
          <InputOTPGroup className="gap-2">
            {[...Array(6)].map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-10 text-lg border-primary/20"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button
          className="auth-verify w-full"
          onClick={verifyOtp}
          disabled={otp.length !== 6 || isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Verify email"
          )}
        </Button>

        <div className="text-center w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={!email || isPending || timeLeft > 0}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {timeLeft > 0 ? (
              <span className="flex items-center gap-2">
                <Timer className="size-3" />
                Resend available in {timeLeft}s
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="size-3" />
                Resend code
              </span>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Check your spam folder. Codes expire after 10 minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
