"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full border border-border bg-card text-center rounded-xl shadow-md">
        <CardHeader>
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mt-2">
            Payment Successful!
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your payment has been processed successfully.  
            You now have full access to the course.
          </p>

          <div className="pt-2">
            <Link href="/dashboard" className="block">
              <Button className="w-full flex items-center justify-center gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
