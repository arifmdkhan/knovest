import Link from "@/components/AppLink";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function AcademyCard({ href, icon: Icon, title, description, actionText }: {
  href: string; icon: LucideIcon; title: string; description: string; actionText: string;
}) {
  return <Link href={href} className="app-panel group flex h-full flex-col gap-4 p-6 transition-colors hover:border-primary/50">
    <span className="flex size-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><Icon className="size-6" strokeWidth={1.6} /></span>
    <div><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    <span className="mt-auto flex items-center gap-2 pt-2 text-sm font-medium text-primary">{actionText}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
  </Link>;
}
