"use client"

import * as React from "react"
import {
  Bell,
  Bookmark,
  BookOpen,
  Home,
  LayoutDashboard,
  MessageCircle,
  Radio,
  Search,
  Settings2,
  User,
  Command,
  ShieldCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { BrandLogo } from "@/components/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { Role } from "@/generated/prisma/client"
import { useMemo } from "react"
import { cn } from "@/lib/utils"


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
      title: "Bookmark",
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
    {
      title: "Expert Verification",
      url: "/admin/expert-verification",
      icon: ShieldCheck,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession()

  const filteredData = useMemo(() => {
    return {
      ...data,
      navMain: data.navMain
        // 1. FILTER: Remove items based on permissions
        .filter((item) => {
          // Admin Restricted Routes
          if (item.url.startsWith("/admin")) {
            const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
            return session?.user?.role && allowedRoles.includes(session.user.role);
          }

          // Creator/Expert Restricted Routes
          if (item.url === "/dashboard") {
            // Initial logic: Admins or Verified Experts can access dashboard
            const hasExpertStatus = !!(session?.user as any)?.expertVerificationType;
            const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
            return hasExpertStatus || isAdmin;
          }

          return true;
        })
        // 2. MAP: Transform specific items (Profile)
        .map((item) => {
          // Check if this is the profile item AND if we have a username
          if (item.url === "/profile" && session?.user?.username) {
            return {
              ...item, // Keep icon and title
              url: `/profile/${session.user.username}` // Override url
            };
          }
          return item; // Return other items unchanged
        }),
    };
  }, [data, session]); // Dependency array

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group">
              <BrandLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavMain items={filteredData.navMain} />
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
