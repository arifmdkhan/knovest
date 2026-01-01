"use client"

import { type LucideIcon } from "lucide-react"

import {
  Collapsible,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { NotificationBadge } from "@/components/NotificationBadge";

import { useMemo } from "react"
// ... (imports)

// ...

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  // Find the single best matching item (longest URL match)
  const activeItemUrl = useMemo(() => {
    if (!pathname) return null;

    // 1. Find all items that could effectively "claim" this path
    const matchingItems = items.filter(item =>
      pathname === item.url || pathname.startsWith(`${item.url}/`)
    );

    // 2. Sort by URL length descending (most specific match first)
    //    e.g. "/admin/expert-verification" (longer) beats "/admin" (shorter)
    matchingItems.sort((a, b) => b.url.length - a.url.length);

    return matchingItems[0]?.url || null;
  }, [pathname, items]);

  return (
    <SidebarGroup>

      <SidebarMenu>
        {items.map((item) => {

          // Only the best match is active
          const isActive = item.url === activeItemUrl;
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  className={cn(
                    "relative transition-all duration-300",
                    isActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Link href={item.url} className="flex items-center w-full relative z-10">
                    {/* Active Background Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      />
                    )}

                    <div className="relative mr-2">
                      {item.icon && (
                        <item.icon
                          className={cn(
                            "size-4 transition-transform duration-300 group-hover/collapsible:scale-110",
                            isActive ? "text-primary" : "text-muted-foreground group-hover/collapsible:text-foreground"
                          )}
                        />
                      )}
                      {item.title === "Notifications" && (
                        <div className="absolute -top-1.5 -right-1.5 z-10">
                          <NotificationBadge />
                        </div>
                      )}
                    </div>
                    <span className="flex-1">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
