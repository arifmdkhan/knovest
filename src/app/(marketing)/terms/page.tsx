import { LegalPage } from "../_components/PublicSections";
import { createMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  alternates: { canonical: "/terms" },
  title: "Terms of Service",
  description: "Terms and conditions for using the Knovest platform.",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms that apply when you use Knovest."
    >
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using <strong>Knovest</strong> (“Platform”, “we”,
            “our”, “us”), you agree to be bound by these Terms of Service
            (“Terms”). If you do not agree, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You must be <strong>at least 18 years old</strong> to use this
              Platform.
            </li>
            <li>
              By using the Platform, you represent that you are legally capable
              of entering into a binding contract under Indian law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Nature of the Platform</h2>
          <p className="mb-4">
            Knovest is a{" "}
            <strong>financial education and social learning platform</strong>{" "}
            that enables users to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Learn from verified and non-verified educators</li>
            <li>
              Access courses, articles, discussions, live sessions, and
              communities
            </li>
            <li>Interact with other users</li>
          </ul>
          <p className="font-semibold text-primary">
            We are not a stock exchange, broker, portfolio manager, or
            investment advisory firm.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You are responsible for maintaining the confidentiality of your
              account.
            </li>
            <li>You agree to provide accurate and up-to-date information.</li>
            <li>You are responsible for all activities under your account.</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate accounts that violate
            these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Roles on the Platform</h2>
          <p className="mb-4">Users may be categorized as:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Admin</strong>
            </li>
            <li>
              <strong>Creator / Educator</strong>
            </li>
            <li>
              <strong>User</strong>
            </li>
          </ul>
          <p className="mt-4">
            Additional permissions or features may apply based on role.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Content Responsibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Users are solely responsible for the content they post.</li>
            <li>
              We do not endorse or guarantee accuracy of user-generated content.
            </li>
            <li>
              Any financial opinions expressed belong to the individual author.
            </li>
          </ul>
          <p className="mt-4">
            We reserve the right to remove content that violates laws or
            platform policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">
            7. Payments, Subscriptions & Refunds
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Payments are processed via third-party gateways (e.g., Razorpay).
            </li>
            <li>
              Subscription terms, pricing, and duration are clearly displayed
              before purchase.
            </li>
            <li>
              Refunds, if applicable, are governed by the specific product’s
              refund policy.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Prohibited Activities</h2>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Post misleading, fraudulent, or illegal financial advice</li>
            <li>Impersonate SEBI-registered entities without authorization</li>
            <li>Attempt to manipulate platform data, users, or payments</li>
            <li>Engage in harassment, abuse, or hate speech</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Intellectual Property</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Platform branding, design, and software belong to Knovest.</li>
            <li>
              Users retain ownership of their content but grant us a{" "}
              <strong>non-exclusive license</strong> to display and distribute
              it on the Platform.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
          <p className="mb-4">
            We may suspend or terminate access without prior notice for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violation of Terms</li>
            <li>Legal or regulatory requirements</li>
            <li>Platform misuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">
            11. Limitation of Liability
          </h2>
          <p className="mb-4">To the maximum extent permitted by law:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We are not liable for financial losses incurred by users.</li>
            <li>We do not guarantee outcomes from educational content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">
            12. Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms are governed by <strong>Indian law</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
          <p>
            We may update these Terms periodically. Continued use implies
            acceptance.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
