import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function KnovestLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" focusable="false" className={cn("size-10 shrink-0", className)} {...props}>
      <image href="/brand/knovest-mark.webp" width="512" height="512" />
    </svg>
  );
}
