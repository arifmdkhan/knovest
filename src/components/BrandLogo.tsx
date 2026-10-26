import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { KnovestLogo } from "./KnovestLogo";

interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "large" | "small";
  showIcon?: boolean;
}

export function BrandLogo({
  className,
  variant = "default",
  showIcon = true,
  ...props
}: BrandLogoProps) {
  return (
    <div
      className={cn(
        "brand-logo inline-flex items-center gap-3 font-sans select-none",
        className,
      )}
      {...props}
    >
      {showIcon && (
        <KnovestLogo
          aria-hidden="true"
          className={cn(
            "shrink-0 text-primary",
            variant === "large"
              ? "size-10"
              : variant === "small"
                ? "size-7"
                : "size-8",
          )}
        />
      )}
      <span
        className={cn(
          "brand-wordmark whitespace-nowrap font-semibold tracking-[0.16em] leading-none text-foreground",
          variant === "large"
            ? "text-2xl"
            : variant === "small"
              ? "text-base"
              : "text-lg",
        )}
      >
        KNO<span className="text-primary">V</span>EST
      </span>
    </div>
  );
}
