"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full border border-border bg-card text-center rounded-xl shadow-md">
        <CardHeader>
          <div className="flex justify-center">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mt-2">
            Payment Cancelled
          </h2>
        </CardHeader>

       <CardContent className="space-y-6">
  {/* Primary Message */}
  <div className="text-center space-y-2">
    <p className="text-muted-foreground text-sm leading-relaxed">
      We couldn&apos;t complete your payment at this time. You can try again whenever you are ready.
    </p>
  </div>

  {/* Reassurance Box - Visually separates the financial safety info */}
  <div className="bg-muted/50 rounded-lg p-4 text-center border border-border/50">
    <p className="text-sm font-medium text-foreground">
      Rest assured, you have not been charged.
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      If you see a pending transaction that doesn&apos;t disappear, please{" "}
      <Link href="/support" className="underline hover:text-primary transition-colors">
        contact our support team
      </Link>.
    </p>
  </div>

  {/* Action Area */}
  <div className="pt-2">
    <Link href="/" passHref>
      <Button className="w-full flex items-center justify-center gap-2" size="lg">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>
    </Link>
  </div>
</CardContent>
      </Card>
    </div>
  );
}
