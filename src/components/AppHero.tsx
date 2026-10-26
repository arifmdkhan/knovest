import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppHero({ title, description, children, centered = false, className }: {
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  centered?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("app-hero", centered && "app-hero-centered", className)}>
      <div className="cosmos" aria-hidden="true" />
      <div className="app-hero-content">
        <h1 className="app-hero-title">{title}</h1>
        {description && <p className="app-hero-description">{description}</p>}
        {children}
      </div>
    </header>
  );
}
