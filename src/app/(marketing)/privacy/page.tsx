import { LegalPage } from "../_components/PublicSections";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  alternates: { canonical: "/privacy" }, title: "Privacy Policy",
  description: "How information is collected and handled on Knovest.",
});

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" description="Information used to provide your Knovest account and services.">
    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      <section><h2>Information we collect</h2><p>Account information includes your name, email, username, optional profile details, and sign-in sessions. Google sign-in provides the profile details you authorize. We store posts, messages, course activity, subscriptions, and media that you submit or interact with.</p><p>If you apply for creator verification, we collect the identity and supporting information you submit. This can include date of birth, nationality, state, PAN, mobile number, registration or certification details, and broker or trading records. Verification is optional. Do not upload unrelated financial or identity information.</p></section>
      <section><h2>How information is used</h2><p>We use information to authenticate accounts, display your chosen public profile and content, deliver messages and lessons, review creator applications, and investigate abuse. Payments are disabled for this release; Knovest does not collect payment card details.</p></section>
      <section><h2>Services used</h2><p>The application uses Neon for its database and object storage, Resend for verification emails, Google for optional sign-in, and Stream for enabled chat and live features. These services receive information needed to perform their functions. Hosting services process requests and operational logs. We may disclose information when legally required.</p></section>
      <section><h2>Public and restricted content</h2><p>Your public profile, approved verification summary, and public posts may be visible to other users. Identity documents and private application fields are intended for authorized review. Avoid putting private information in your public profile, messages to others, or public content. A verification badge records a review of submitted material; it does not guarantee continuing registration or investment outcomes.</p></section>
      <section><h2>Cookies and logs</h2><p>Essential cookies maintain sign-in sessions and account selection. Browser storage may retain an unfinished registration draft. No advertising or third-party analytics tracker is currently integrated. Service providers may maintain their own operational logs. Blocking essential cookies can prevent sign-in.</p></section>
      <section><h2>Access and deletion</h2><p>You can update profile information through account settings. Contact support to request access, correction, or account deletion. Content deletion can queue removal of stored media; cached or previously downloaded copies may remain outside Knovest. Backups and records required for legal or operational purposes may have separate retention periods.</p><p>Support: <strong>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "Support contact is not yet configured. Public registration should remain closed until it is published."}</strong></p></section>
      <section><h2>Protection and retention</h2><p>Access controls restrict account operations and verification records. No system can guarantee absolute security. The operating entity, service locations, grievance contact, and specific retention periods must be confirmed before public launch. Material policy changes will be published here.</p></section>
    </div>
  </LegalPage>;
}
