"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { authClient } from "@/lib/auth-client";
import { updateProfileAfterLogin } from "@/server/actions/register";

export function OTPForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");

  const [otp, setOtp] = useState("");
  const [isPending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (email) {
      const storedAttempts = localStorage.getItem(`otp_attempts_${email}`);
      if (storedAttempts) {
        const count = parseInt(storedAttempts);
        setAttempts(count);
        if (count >= 3) setIsLocked(true);
      }
    }
  }, [email]);

  const verifyOtp = () => {
    if (!email) return;

    startTransition(async () => {
      // 1. Verify OTP (Logs user in if successful)
      await authClient.signIn.emailOtp({
        email,
        otp,
        fetchOptions: {
          onSuccess: async () => {
            // 2. Check for pending registration data
            const pendingReg = sessionStorage.getItem("pending_reg");
            if (pendingReg) {
              const data = JSON.parse(pendingReg);
              // 3. Update the profile with Name/Username
              await updateProfileAfterLogin({
                name: data.name,
                username: data.username
              });
              sessionStorage.removeItem("pending_reg");
            }
            toast.success("Welcome!");
            router.push("/home");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Invalid OTP");
          }
        }
      });
    });
  };

  const handleResend = () => {
    if (!email || isLocked) return;

    startTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            const newCount = attempts + 1;
            setAttempts(newCount);
            localStorage.setItem(`otp_attempts_${email}`, newCount.toString());

            if (newCount >= 3) {
              setIsLocked(true);
              toast.error("Max attempts reached. Try again later.");
            } else {
              toast.success(`Code resent. ${3 - newCount} attempts left.`);
            }
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          }
        }
      });
    });
  };

  return (
    <Card className="w-full max-w-sm border-border/50 shadow-xl bg-card/50 backdrop-blur-md">
      <CardHeader className="text-center">
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>Enter code sent to {email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isPending}>
          <InputOTPGroup className="gap-2">
            {[...Array(6)].map((_, i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-10 text-lg border-primary/20" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button className="w-full" onClick={verifyOtp} disabled={otp.length !== 6 || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify"}
        </Button>

        <div className="text-center">
          {isLocked ? (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Max attempts reached
            </span>
          ) : (
            <Button variant="link" size="sm" onClick={handleResend} disabled={isPending}>
              <RefreshCw className={`w-3 h-3 mr-2 ${isPending ? "animate-spin" : ""}`} />
              Resend Code
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}