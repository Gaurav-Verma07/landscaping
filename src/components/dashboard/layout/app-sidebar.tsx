"use client"

import * as React from "react"
import {
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Plug,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  UserCircle,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/ui/sidebar/nav-main"
import { NavUser } from "@/components/dashboard/ui/sidebar/nav-user"
import { TeamSwitcher } from "@/components/dashboard/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const nav = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: UserCircle,
    },
    {
      title: "Communications",
      url: "/dashboard/communications",
      icon: MessageSquare,
      items: [
        { title: "Inbox", url: "/dashboard/communications" },
        { title: "Settings", url: "/dashboard/communications/settings" },
      ],
    },
    {
      title: "Outreach",
      url: "/dashboard/outreach",
      icon: Megaphone,
    },
    {
      title: "Appointments",
      url: "/dashboard/appointments",
      icon: Calendar,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: FolderKanban,
      items: [
        { title: "Projects", url: "/dashboard/projects" },
        { title: "Job Board", url: "/dashboard/projects/job-board" },
      ],
    },
    {
      title: "Quotes & Invoicing",
      url: "/dashboard/quotes",
      icon: FileText,
      items: [
        { title: "Quotes", url: "/dashboard/quotes" },
        { title: "Contracts", url: "/dashboard/contracts" },
        { title: "Invoices", url: "/dashboard/invoices" },
      ],
    },
    {
      title: "Crew & Labor",
      url: "/dashboard/crew",
      icon: Users,
    },
    {
      title: "Equipment",
      url: "/dashboard/equipment",
      icon: Truck,
    },
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: ClipboardList,
    },
    {
      title: "Design",
      url: "/dashboard/design",
      icon: Sparkles,
    },
    {
      title: "Marketing",
      url: "/dashboard/marketing",
      icon: Target,
    },
    {
      title: "Admin & Audit",
      url: "/dashboard/admin",
      icon: ShieldCheck,
    },
  ],
  management: [
    {
      name: "Integrations",
      url: "/dashboard/management/integrations",
      icon: Plug,
    },
    {
      name: "Settings",
      url: "/dashboard/management/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
  const [teams, setTeams] = React.useState<{ name: string; logoSrc: string; plan: string }[]>([])

  const load = React.useCallback(async () => {
    if (!user?.id) {
      setTeams([{ name: "Landscaping", logoSrc: "/logo.png", plan: "Enterprise" }])
      return
    }
    setTeams([{ name: "Landscaping", logoSrc: "/logo.png", plan: "Enterprise" }])
  }, [user?.id])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    const onFocus = () => load()
    const onSettingsUpdated = () => load()
    window.addEventListener("focus", onFocus)
    window.addEventListener("settings-updated", onSettingsUpdated)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("settings-updated", onSettingsUpdated)
    }
  }, [load])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {teams.length ? <TeamSwitcher teams={teams} /> : (
          <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Loading team...</div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
        <div className="text-muted-foreground px-2 pb-1 text-xs group-data-[collapsible=icon]:hidden">
          Powered by Landscaping
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

