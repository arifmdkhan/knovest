import { cn } from "@/lib/utils";

export function PremiumBackground({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("relative isolate w-full h-full bg-background overflow-hidden", className)}>
    <div className="cosmos" aria-hidden="true" />
    <div className="relative w-full h-full">{children}</div>
  </div>;
}
