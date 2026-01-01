"use client"

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar"
import { ShieldCheck, User } from "lucide-react"

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
    <Sidebar collapsible="icon" {...props}>

      <SidebarContent>
        <NavMain items={data.navMain} />

      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
