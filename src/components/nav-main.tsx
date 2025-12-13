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
import { NotificationBadge } from "@/components/notification-badge"

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

  return (
    <SidebarGroup>

      <SidebarMenu>
        {items.map((item) => {
         
          // Old: const isActive = pathname === item.url;
          const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`);
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
