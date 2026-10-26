import { LegalPage } from "../_components/PublicSections";
import { createMetadata } from "@/lib/metadata";
import {
  AlertTriangle,
  ShieldAlert,
  GraduationCap,
  LinkIcon,
  AlertCircle,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  alternates: { canonical: "/disclaimer" },
  title: "Disclaimer",
  description:
    "Important legal disclaimers regarding educational content and market risks.",
});

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      description="Understand the educational purpose of Knovest and the risks associated with financial markets."
    >
      <div className="space-y-12">
        <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-yellow-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Important Legal Disclaimer
              </h2>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                Please read this entire page carefully before using the
                platform.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <GraduationCap className="h-5 w-5" />
            <h3>1. Educational Purpose Only</h3>
          </div>
          <p>
            All content on <strong>Knovest</strong> is provided{" "}
            <strong>solely for educational and informational purposes</strong>.
          </p>
          <p>Nothing on this Platform constitutes:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Investment advice</li>
            <li>Trading advice</li>
            <li>Financial advisory services</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <ShieldAlert className="h-5 w-5" />
            <h3>2. No SEBI Advisory Unless Explicitly Stated</h3>
          </div>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Some educators may be SEBI-registered.</li>
            <li>Registration status is displayed where applicable.</li>
            <li>
              Even SEBI-registered professionals provide{" "}
              <strong>educational content only</strong>, unless explicitly
              stated otherwise.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <h3>3. Market Risk Disclosure</h3>
          </div>
          <p>
            Investments and trading are subject to <strong>market risks</strong>
            . Past performance does not guarantee future results.
          </p>
          <p>Users are advised to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Do their own research</li>
            <li>
              Consult licensed professionals before making financial decisions
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <AlertCircle className="h-5 w-5" />
            <h3>4. Platform Liability</h3>
          </div>
          <p>
            <strong>Knovest</strong> is <strong>not responsible</strong> for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Losses incurred due to decisions based on content</li>
            <li>Actions of individual educators or users</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <LinkIcon className="h-5 w-5" />
            <h3>5. External Links</h3>
          </div>
          <p>
            We are not responsible for third-party websites linked on the
            Platform.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold">6. User Responsibility</h3>
          <p>By using the Platform, you acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>You understand the risks involved</li>
            <li>You are solely responsible for your decisions</li>
          </ul>
        </section>

        <div className="border-t border-border/40 pt-8 mt-12">
          <h3 className="font-bold mb-2">Contact Information</h3>
          <p className="text-muted-foreground">
            For legal or privacy concerns: <br />
            <a
              href={
                process.env.NEXT_PUBLIC_SUPPORT_EMAIL
                  ? `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`
                  : "/contact"
              }
              className="text-primary hover:underline"
            >
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
                "Contact details coming soon"}
            </a>
          </p>
        </div>
      </div>
    </LegalPage>
  );
}
