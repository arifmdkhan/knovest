import Link from "next/link";
import { getServerSession } from "@/lib/get-sessions";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession()
  if (session) redirect('/home')


  return (
    <div className="min-h-screen w-full bg-background relative flex flex-col items-center justify-center overflow-hidden">

      {/* BACKGROUND: Technical Grid Pattern */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {/* Grid lines */}
        <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Radial Gradient for focus */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 opacity-50 blur-[100px]"></div>
      </div>

      {/* Header / Branding */}
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 group" aria-label="Home">
        <BrandLogo />
      </Link>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-500">
        {children}
      </main>

      {/* Footer / Legal Links */}
      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-xs text-muted-foreground">
          © 2025 Consensus Inc.{" "}
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