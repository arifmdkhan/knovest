"use client"

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertCircle, Timer } from "lucide-react";

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
  // Lazy initialization for attempts
  const [attempts, setAttempts] = useState(() => {
    if (typeof window === 'undefined' || !email) return 0;
    const stored = localStorage.getItem(`otp_attempts_${email}`);
    return stored ? parseInt(stored) : 0;
  });

  // Lazy initialization for locked state
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === 'undefined' || !email) return false;
    const stored = localStorage.getItem(`otp_attempts_${email}`);
    return stored ? parseInt(stored) >= 3 : false;
  });

  // Lazy initialization for timer
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window === 'undefined' || !email) return 30;
    const lastResend = localStorage.getItem(`otp_last_resend_${email}`);

    if (lastResend) {
      const lastTime = parseInt(lastResend);
      const diffInSeconds = Math.floor((Date.now() - lastTime) / 1000);
      if (diffInSeconds < 30) return 30 - diffInSeconds;
    }
    return 30;
  });

  // Effect to ensure start timestamp exists if we have timeLeft > 0
  useEffect(() => {
    if (email && timeLeft > 0) {
      const lastResend = localStorage.getItem(`otp_last_resend_${email}`);
      if (!lastResend) {
        localStorage.setItem(`otp_last_resend_${email}`, Date.now().toString());
      }
    }
  }, [email, timeLeft]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const verifyOtp = () => {
    if (!email) return;

    startTransition(async () => {
      await authClient.signIn.emailOtp({
        email,
        otp,
        fetchOptions: {
          onSuccess: async () => {
            const pendingReg = sessionStorage.getItem("pending_reg");
            if (pendingReg) {
              const data = JSON.parse(pendingReg);
              await updateProfileAfterLogin({
                name: data.name,
                username: data.username
              });
              sessionStorage.removeItem("pending_reg");
            }
            localStorage.removeItem(`otp_attempts_${email}`);
            localStorage.removeItem(`otp_last_resend_${email}`);

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
    if (!email || isLocked || timeLeft > 0) return;

    startTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            const newCount = attempts + 1;
            setAttempts(newCount);

            // Persist State
            localStorage.setItem(`otp_attempts_${email}`, newCount.toString());
            localStorage.setItem(`otp_last_resend_${email}`, Date.now().toString());

            // Start Timer
            setTimeLeft(30);

            if (newCount >= 3) {
              setIsLocked(true);
              toast.error("Max attempts reached. Please try again later.");
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

        <div className="text-center w-full">
          {isLocked ? (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" /> Max resend attempts reached
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isPending || timeLeft > 0}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              {timeLeft > 0 ? (
                <span className="flex items-center gap-2">
                  <Timer className="w-3 h-3" /> Resend available in {timeLeft}s
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
                  Resend Code
                </span>
              )}
            </Button>
          )}
          {!isLocked && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {3 - attempts} resend attempts remaining
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}