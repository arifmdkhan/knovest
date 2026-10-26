import type { Metadata } from "next";
import Link from "@/components/AppLink";
import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession()
  if (session) redirect('/home')

  return (
    <div className="knovest-app auth-shell">
      <div className="cosmos" aria-hidden="true" />
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <Link href="/" className="relative flex items-center gap-2" aria-label="Knovest home">
        <BrandLogo />
      </Link>
      <main className="relative w-full max-w-[460px]">
        {children}
      </main>
      <div className="relative w-full text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Knovest{" "}
          <Link href="/terms" className="hover:text-primary underline underline-offset-4 transition-colors">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-primary underline underline-offset-4 transition-colors">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
