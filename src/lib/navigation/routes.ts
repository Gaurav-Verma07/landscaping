export interface RouteAlias {
  title: string
  path: string
  aliases: string[]
  category: string
  description?: string
}

export const DASHBOARD_ROUTES: RouteAlias[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    aliases: ["dashboard", "home", "main", "overview"],
    category: "Main Navigation",
    description: "Main dashboard overview"
  },
  {
    title: "Customers",
    path: "/dashboard/customers",
    aliases: ["customers", "customer list", "all customers", "crm"],
    category: "Main Navigation",
    description: "Customer management"
  },
  {
    title: "Communications",
    path: "/dashboard/communications",
    aliases: ["communications", "messages", "inbox", "emails", "sms", "calls"],
    category: "Main Navigation",
    description: "Emails, SMS and call logs"
  },
  {
    title: "Communication settings",
    path: "/dashboard/communications/settings",
    aliases: ["communication settings", "message templates", "create message", "communications settings"],
    category: "Communications",
    description: "Create message and message templates"
  },
  {
    title: "Outreach",
    path: "/dashboard/outreach",
    aliases: ["outreach", "lead generation", "leads", "linkedin"],
    category: "Main Navigation",
    description: "Lead generation and outreach automation"
  },
  {
    title: "Appointments",
    path: "/dashboard/appointments",
    aliases: ["appointments", "calendar", "schedule", "booking"],
    category: "Main Navigation",
    description: "Appointments and calendar"
  },
  {
    title: "Projects",
    path: "/dashboard/projects",
    aliases: ["projects", "jobs", "all projects"],
    category: "Main Navigation",
    description: "Project management"
  },
  {
    title: "Job Board",
    path: "/dashboard/projects/job-board",
    aliases: ["job board", "kanban", "board"],
    category: "Projects",
    description: "Project job board"
  },
  {
    title: "Quotes",
    path: "/dashboard/quotes",
    aliases: ["quotes", "estimates", "quotations", "pricing"],
    category: "Quotes & Invoicing",
    description: "Quotes and estimates"
  },
  {
    title: "Contracts",
    path: "/dashboard/contracts",
    aliases: ["contracts", "agreements", "e-signature"],
    category: "Quotes & Invoicing",
    description: "Contracts"
  },
  {
    title: "Invoices",
    path: "/dashboard/invoices",
    aliases: ["invoices", "billing", "all invoices"],
    category: "Quotes & Invoicing",
    description: "Invoicing"
  },
  {
    title: "Suppliers",
    path: "/dashboard/suppliers",
    aliases: ["suppliers", "supplier directory"],
    category: "Quotes & Invoicing",
    description: "Supplier directory"
  },
  {
    title: "Materials",
    path: "/dashboard/materials",
    aliases: ["materials", "catalog", "material catalog"],
    category: "Quotes & Invoicing",
    description: "Material catalog"
  },
  {
    title: "Crew & Labor",
    path: "/dashboard/crew",
    aliases: ["crew", "labor", "team", "time tracking", "crew management"],
    category: "Main Navigation",
    description: "Labor and crew management"
  },
  {
    title: "Equipment",
    path: "/dashboard/equipment",
    aliases: ["equipment", "trucks", "scheduling", "machinery"],
    category: "Main Navigation",
    description: "Equipment and truck scheduling"
  },
  {
    title: "Documents",
    path: "/dashboard/documents",
    aliases: ["documents", "files", "media", "vault"],
    category: "Main Navigation",
    description: "Document and media management"
  },
  {
    title: "Design",
    path: "/dashboard/design",
    aliases: ["design", "landscape design", "design tool"],
    category: "Main Navigation",
    description: "Landscape design tool"
  },
  {
    title: "Marketing",
    path: "/dashboard/marketing",
    aliases: ["marketing", "campaigns", "marketing automation"],
    category: "Main Navigation",
    description: "Marketing automation"
  },
  {
    title: "Admin & Audit",
    path: "/dashboard/admin",
    aliases: ["admin", "audit", "audit logs", "administration"],
    category: "Main Navigation",
    description: "Admin and audit"
  },
  {
    title: "Integrations",
    path: "/dashboard/management/integrations",
    aliases: ["integrations", "third party", "connections", "apps"],
    category: "Management",
  },
  {
    title: "Settings",
    path: "/dashboard/management/settings",
    aliases: ["settings", "preferences", "configuration", "account settings"],
    category: "Management",
  },
]

export function findRoute(query: string): RouteAlias | null {
  const normalizedQuery = query.toLowerCase().trim()

  for (const route of DASHBOARD_ROUTES) {
    if (route.aliases.some(alias => normalizedQuery === alias)) {
      return route
    }
  }

  for (const route of DASHBOARD_ROUTES) {
    if (route.aliases.some(alias => 
      normalizedQuery.includes(alias) || alias.includes(normalizedQuery)
    )) {
      return route
    }
  }

  for (const route of DASHBOARD_ROUTES) {
    const normalizedTitle = route.title.toLowerCase()
    if (normalizedQuery.includes(normalizedTitle) || normalizedTitle.includes(normalizedQuery)) {
      return route
    }
  }
  
  return null
}

export function getAllRouteAliases(): string[] {
  return DASHBOARD_ROUTES.map(route => route.title)
}

export function getRoutesByCategory(): Record<string, RouteAlias[]> {
  return DASHBOARD_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = []
    }
    acc[route.category].push(route)
    return acc
  }, {} as Record<string, RouteAlias[]>)
}
