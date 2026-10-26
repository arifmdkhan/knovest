import { Metadata } from "next";
import Link from "@/components/AppLink";
import { ChevronLeft } from "lucide-react";
import { OTPForm } from "../_components/OTPForm";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Verify Email",
  description: "Verify your email using OTP",
});

export default function VerifyRequestPage() {
    return (
        <div className="flex flex-col items-center space-y-6">
            <Link
                href="/register"
                className="flex min-h-11 self-start items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Link>
            <OTPForm />
        </div>
    );
}
