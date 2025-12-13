"use client"

import {
  IconLogout,
  IconSettings,
  IconShield,
  IconUser,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { ChevronsUpDown, HomeIcon, Sparkles } from "lucide-react"
import useSignOut from "@/hooks/use-signout"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, isPending } = authClient.useSession()
  const handleSignout = useSignOut()

  if (isPending) {
    return <div className="h-12 w-full animate-pulse bg-sidebar-accent/50 rounded-lg" />
  }

  const user = session?.user;
  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent/50 group"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border shadow-sm group-hover:scale-105 transition-transform duration-200">
                <AvatarImage src={user.image ?? `https://avatar.vercel.sh/${user.email}`} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-semibold">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "Administrator" : `${user.username}`}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl p-2"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                  <AvatarImage src={user.image ?? `https://avatar.vercel.sh/${user.email}`} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name || user.email.split('@')[0]}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50 my-1" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                <Link href='/'>
                  <HomeIcon className="mr-2 size-4" />
                  Landing page
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                <Link href={`/profile/${user.username}`}>
                  <IconUser className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                <Link href="/settings">
                  <IconSettings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50 my-1" />
            {user.role === "ADMIN" && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="focus:bg-orange-500/10 focus:text-orange-600 cursor-pointer">
                    <Link href='/admin'>
                      <IconShield className="mr-2 size-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50 my-1" />
              </>
            )}

            <DropdownMenuItem onSelect={handleSignout} className="focus:bg-destructive/10 focus:text-destructive cursor-pointer text-destructive/80">
              <IconLogout className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
