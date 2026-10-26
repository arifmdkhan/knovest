"use client"

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/BrandLogo";
import Link from "@/components/AppLink";
import { ShieldCheck, User } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Admin Dashboard",
      url: "/admin",
      icon: ShieldCheck,
    },
    {
      title: "Expert Verification",
      url: "/admin/expert-verification",
      icon: ShieldCheck,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: User,
    }

  ],

}

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border">
      <SidebarHeader className="h-20 justify-center border-b border-sidebar-border px-5 group-data-[collapsible=icon]:px-3">
        <Link href="/home" aria-label="Knovest home"><BrandLogo className="[&>.brand-wordmark]:group-data-[collapsible=icon]:hidden" /></Link>
      </SidebarHeader>
      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <NavMain items={data.navMain} />

      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-1">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
