import { Metadata } from "next";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { OTPForm } from "../_components/OTPForm";

export const metadata: Metadata = {
    title: "Verify Email | CONSENSUS",
};

export default function VerifyRequestPage() {
    return (
        <div className="flex flex-col items-center space-y-6">
            <Link
                href="/register"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors absolute top-8 left-4 md:left-8"
            >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Link>
            <OTPForm />
        </div>
    );
}