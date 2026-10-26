"use client";

import { type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import Link from "@/components/AppLink";
import { usePathname } from "next/navigation";
import { NotificationBadge } from "@/components/NotificationBadge";

export function NavMain({ items }: { items: { title: string; url: string; icon?: LucideIcon }[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const activeUrl = items.filter(item => pathname === item.url || pathname.startsWith(`${item.url}/`))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

  return (
    <SidebarGroup className="app-navigation px-2 py-2">
      <SidebarMenu className="gap-[3px]">
        {items.map((item) => (
          <SidebarMenuItem key={item.url} className={item.url === "/trade-room" ? "app-navigation-section border-t border-sidebar-border" : undefined}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={activeUrl === item.url}
              className="px-3 text-[14px] font-medium transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
              <Link href={item.url} aria-current={activeUrl === item.url ? "page" : undefined} onClick={() => { if (isMobile) setOpenMobile(false); }}>
                {item.icon && <item.icon className="size-[19px] shrink-0" strokeWidth={1.7} />}
                <span className="ml-1 min-w-0 flex-1 truncate group-data-[collapsible=icon]:sr-only">{item.title}</span>
                {item.title === "Notifications" && <NotificationBadge />}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
