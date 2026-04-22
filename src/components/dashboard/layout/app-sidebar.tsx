"use client"

import * as React from "react"
import {
  Calendar,
  Calculator,
  CloudLightning,
  DollarSign,
  FileText,
  FolderKanban,
  Hammer,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings2,
  UserCog,
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
      title: "Clients",
      url: "/dashboard/clients",
      icon: Users,
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
      title: "Projects",
      url: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: "Schedule",
      url: "/dashboard/schedule",
      icon: Calendar,
      items: [
        { title: "Calendar", url: "/dashboard/schedule/calendar" },
        { title: "Assign Crews", url: "/dashboard/schedule/assign" },
        { title: "Weather Alerts", url: "/dashboard/schedule/weather" },
      ],
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: FileText,
      items: [
        { title: "Create Invoice", url: "/dashboard/invoices/create" },
        { title: "Materials Costs", url: "/dashboard/invoices/materials" },
        { title: "Labor Costs", url: "/dashboard/invoices/labor" },
        { title: "Paid / Unpaid", url: "/dashboard/invoices/status" },
      ],
    },
    {
      title: "Estimates",
      url: "/dashboard/estimates",
      icon: Calculator,
      items: [
        { title: "Quick Quote", url: "/dashboard/estimates/quick" },
        { title: "Full Estimate", url: "/dashboard/estimates/full" },
        { title: "Templates", url: "/dashboard/estimates/templates" },
      ],
    },
    {
      title: "Storm Mode",
      url: "/dashboard/storm-mode",
      icon: CloudLightning,
      items: [
        { title: "Reps & Territory", url: "/dashboard/storm-mode/reps" },
        { title: "Deals Closed", url: "/dashboard/storm-mode/deals" },
        { title: "Commission Calculator", url: "/dashboard/storm-mode/commission" },
        { title: "Payouts Due", url: "/dashboard/storm-mode/payouts" },
      ],
    },
  ],
  management: [
    {
      name: "Staff & Roles",
      url: "/dashboard/management/staff",
      icon: UserCog,
    },
    {
      name: "Subcontractors",
      url: "/dashboard/management/subcontractors",
      icon: Hammer,
    },
    {
      name: "Pricing Backend",
      url: "/dashboard/management/pricing",
      icon: DollarSign,
    },
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

