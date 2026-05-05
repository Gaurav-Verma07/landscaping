"use client"

import * as React from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Moon,
  Plug,
  Settings2,
  Sun,
} from "lucide-react"

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

import { useUserStore } from "@/store/use-user-store"
import { signOut } from "@/app/auth/actions"
import { getProfile } from "@/lib/actions/profile"
import { AccountSettingsDialog } from "@/components/dashboard/ui/sidebar/account-settings-dialog"
import { useTheme } from "next-themes"

type ProfileSnapshot = {
  full_name: string | null
  avatar_url: string | null
  team_logo_url: string | null
}

export function NavUser({
  user: propUser,
}: {
  user?: {
    name?: string
    email?: string
    avatar?: string
    user_metadata?: any
  }
}) {
  const { isMobile } = useSidebar()
  const storeUser = useUserStore((state) => state.user)
  const user = storeUser || propUser
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [profile, setProfile] = React.useState<ProfileSnapshot | null>(null)

  const fetchProfile = React.useCallback(async () => {
    const data = await getProfile()
    if (data) {
      setProfile({
        full_name: data.full_name ?? null,
        avatar_url: data.avatar_url ?? null,
        team_logo_url: data.team_logo_url ?? null,
      })
    }
  }, [])

  React.useEffect(() => {
    setMounted(true)
    fetchProfile()

    // Re-sync whenever settings are saved
    window.addEventListener("settings-updated", fetchProfile)
    return () => window.removeEventListener("settings-updated", fetchProfile)
  }, [fetchProfile])

  // Profile DB data takes priority over auth metadata
  const name = profile?.full_name  || user?.email?.split("@")[0] || "User"
  const email = user?.email || ""
  const avatar = profile?.team_logo_url || profile?.avatar_url  || ""
  const initials = name.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
  }

  const cycleTheme = () => {
    if (!mounted) return
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setAccountOpen(true)
                  }}
                >
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={cycleTheme} disabled={!mounted}>
                  {theme === "dark" ? <Moon /> : <Sun />}
                  Toggle theme
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs">Management</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/management/integrations">
                    <Plug />
                    Integrations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/management/settings">
                    <Settings2 />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AccountSettingsDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  )
}