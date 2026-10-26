"use client"

import * as React from "react"
import { Bell, Bookmark, BookOpen, Home, LayoutDashboard, MessageCircle, Radio, Search, Settings2, User } from "lucide-react";

import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { BrandLogo } from "./BrandLogo";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { type SessionUser } from "@/types/user";
import { useMemo } from "react";
import Link from "@/components/AppLink";



const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: Home,

    },
    {
      title: "Search",
      url: "/search",
      icon: Search,

    },
    {
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,

    }, {
      title: "Bookmarks",
      url: "/bookmark",
      icon: Bookmark,

    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,

    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,

    },
    {
      title: "Trade Room",
      url: "/trade-room",
      icon: Radio,

    },
    {
      title: "Academy",
      url: "/academy",
      icon: BookOpen,

    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,

    },


    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,

    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()

  const filteredData = useMemo(() => {
    return {
      ...data,
      navMain: data.navMain
        //Remove items based on permissions
        .filter((item) => {
          const user = session?.user as SessionUser | undefined;
          //Expert Restricted Routes
          if (item.url === "/dashboard") {
            // Admins or Verified Experts can access dashboard
            const hasExpertStatus = !!user?.expertVerificationType;
            const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
            return hasExpertStatus || isAdmin;
          }

          return true;
        })
        .map((item) => {
          const user = session?.user as SessionUser | undefined;
          // Check if this is the profile item AND if we have a username
          if (item.url === "/profile" && user?.username) {
            return {
              ...item, 
              url: `/profile/${user.username}` 
            };
          }
          return item; 
        }),
    };
  }, [session]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-[80px] justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-transparent [&_svg]:size-9">
              <Link href="/home" aria-label="Knovest home"><BrandLogo className="gap-3 [&>.brand-wordmark]:group-data-[collapsible=icon]:hidden" /></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <NavMain items={filteredData.navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-1">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
