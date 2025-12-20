import { createMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata:Metadata = createMetadata({
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal data.",
});

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                <section>
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                        This Privacy Policy explains how <strong>Consensus</strong> collects, uses, and protects your personal data in accordance with:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Information Technology Act, 2000</li>
                        <li>IT Rules, 2011</li>
                        <li>Applicable Indian data protection standards</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">a. Personal Information</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Name, email, profile details</li>
                                <li>Payment details (processed securely by payment gateways)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">b. Usage Data</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Device, browser, IP address</li>
                                <li>Interaction logs and analytics</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">3. How We Use Your Data</h2>
                    <p className="mb-4">We use data to:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Provide platform services</li>
                        <li>Process payments and subscriptions</li>
                        <li>Improve user experience</li>
                        <li>Ensure security and compliance</li>
                    </ul>
                    <p className="font-semibold text-primary">We do not sell personal data.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
                    <p className="mb-4">Data may be shared with:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Payment gateways</li>
                        <li>Analytics providers</li>
                        <li>Legal authorities (if required by law)</li>
                    </ul>
                    <p>All partners follow strict confidentiality standards.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                    <p className="mb-4">We implement:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Encryption</li>
                        <li>Secure access controls</li>
                        <li>Regular monitoring</li>
                    </ul>
                    <p>Despite safeguards, no system is 100% secure.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">6. Cookies & Tracking</h2>
                    <p className="mb-4">We use cookies to:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Maintain sessions</li>
                        <li>Analyze platform usage</li>
                    </ul>
                    <p>You may control cookies via browser settings.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">7. User Rights</h2>
                    <p className="mb-4">You may:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Access or update your data</li>
                        <li>Request deletion of your account</li>
                        <li>Withdraw consent where applicable</li>
                    </ul>
                    <p>Contact us at <strong>support@consensus.com</strong>.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
                    <p>Data is retained only as long as necessary for legal or operational purposes.</p>
                </section>


                <section>
                    <h2 className="text-2xl font-bold mb-4">9. Changes to Privacy Policy</h2>
                    <p>Updates will be posted on this page.</p>
                </section>

            </div>
        </div>
    );
}
