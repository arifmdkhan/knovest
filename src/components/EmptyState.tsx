import { Ban, PlusCircle, LucideIcon } from 'lucide-react';
import Link from "@/components/AppLink"
import { buttonVariants } from './ui/button';


interface EmptyStateProps {
  title: string
  description: string
  buttonText: string
  href: string
  icon?: LucideIcon
}

export function EmptyState({ title, description, buttonText, href, icon: Icon = Ban }: EmptyStateProps) {
  return (
    <div className="app-panel flex flex-col items-center justify-center h-full flex-1 p-10 text-center">
      <div className="relative">
        <div className="flex items-center justify-center size-24 rounded-2xl bg-primary/10">
          <Icon className="size-12 text-primary" />
        </div>
      </div>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">{title}</h2>

      <p className="mt-3 mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>

      <Link href={href} className={buttonVariants({ size: "lg" })}>
        <PlusCircle className="size-5 mr-2" />
        {buttonText}
      </Link>
    </div>
  )
}
