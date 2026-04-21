/**
 * Navigation Routes Registry for Voice Commands
 * 
 * This module provides a centralized registry of all dashboard routes
 * with metadata for voice navigation commands.
 */

export interface RouteAlias {
  /** Display name for the route */
  title: string
  /** Actual Next.js route path */
  path: string
  /** Alternative names/phrases that can trigger this route */
  aliases: string[]
  /** Category for grouping (Main Navigation, Management, etc.) */
  category: string
  /** Optional description for better voice understanding */
  description?: string
}

/**
 * Complete registry of all dashboard routes with voice command aliases
 */
export const DASHBOARD_ROUTES: RouteAlias[] = [
  // Main Dashboard
  {
    title: "Dashboard",
    path: "/dashboard",
    aliases: ["dashboard", "home", "main", "overview"],
    category: "Main Navigation",
    description: "Main dashboard overview"
  },

  // Clients Section
  {
    title: "Clients",
    path: "/dashboard/clients",
    aliases: ["clients", "client list", "all clients", "customers"],
    category: "Main Navigation",
    description: "Client management"
  },

  // Projects Section
  {
    title: "Projects",
    path: "/dashboard/projects",
    aliases: ["projects", "jobs", "all projects"],
    category: "Main Navigation",
    description: "Project management"
  },

  // Schedule Section
  {
    title: "Schedule",
    path: "/dashboard/schedule",
    aliases: ["schedule", "scheduling", "calendar view"],
    category: "Main Navigation",
    description: "Scheduling and calendar"
  },
  {
    title: "Calendar",
    path: "/dashboard/schedule/calendar",
    aliases: ["calendar", "schedule calendar", "view calendar", "show calendar"],
    category: "Schedule",
  },
  {
    title: "Assign Crews",
    path: "/dashboard/schedule/assign",
    aliases: ["assign crews", "crew assignment", "assign team", "schedule crews"],
    category: "Schedule",
  },
  {
    title: "Weather Alerts",
    path: "/dashboard/schedule/weather",
    aliases: ["weather alerts", "weather", "weather warnings", "forecast"],
    category: "Schedule",
  },

  // Invoices Section
  {
    title: "Invoices",
    path: "/dashboard/invoices",
    aliases: ["invoices", "billing", "all invoices"],
    category: "Main Navigation",
    description: "Invoice management"
  },
  {
    title: "Create Invoice",
    path: "/dashboard/invoices/create",
    aliases: ["create invoice", "new invoice", "add invoice", "make invoice"],
    category: "Invoices",
  },
  {
    title: "Materials Costs",
    path: "/dashboard/invoices/materials",
    aliases: ["materials costs", "material expenses", "materials"],
    category: "Invoices",
  },
  {
    title: "Labor Costs",
    path: "/dashboard/invoices/labor",
    aliases: ["labor costs", "labor expenses", "workforce costs"],
    category: "Invoices",
  },
  {
    title: "Invoice Status",
    path: "/dashboard/invoices/status",
    aliases: ["invoice status", "paid invoices", "unpaid invoices", "payment status"],
    category: "Invoices",
  },

  // Estimates Section
  {
    title: "Estimates",
    path: "/dashboard/estimates",
    aliases: ["estimates", "quotes", "quotations", "pricing"],
    category: "Main Navigation",
    description: "Estimate and quote generation"
  },
  {
    title: "Quick Quote",
    path: "/dashboard/estimates/quick",
    aliases: ["quick quote", "fast quote", "quick estimate", "simple estimate"],
    category: "Estimates",
  },
  {
    title: "Full Estimate",
    path: "/dashboard/estimates/full",
    aliases: ["full estimate", "detailed estimate", "complete estimate", "comprehensive quote"],
    category: "Estimates",
  },
  {
    title: "Templates",
    path: "/dashboard/estimates/templates",
    aliases: ["estimate templates", "quote templates", "templates"],
    category: "Estimates",
  },

  // Storm Mode Section
  {
    title: "Storm Mode",
    path: "/dashboard/storm-mode",
    aliases: ["storm mode", "emergency mode", "storm"],
    category: "Main Navigation",
    description: "Storm response management"
  },
  {
    title: "Reps & Territory",
    path: "/dashboard/storm-mode/reps",
    aliases: ["reps", "representatives", "territory", "sales reps", "reps and territory"],
    category: "Storm Mode",
  },
  {
    title: "Deals Closed",
    path: "/dashboard/storm-mode/deals",
    aliases: ["deals closed", "closed deals", "sales", "won deals"],
    category: "Storm Mode",
  },
  {
    title: "Commission Calculator",
    path: "/dashboard/storm-mode/commission",
    aliases: ["commission calculator", "calculate commission", "commissions"],
    category: "Storm Mode",
  },
  {
    title: "Payouts Due",
    path: "/dashboard/storm-mode/payouts",
    aliases: ["payouts due", "pending payouts", "payouts", "payments due"],
    category: "Storm Mode",
  },

  // Management Section
  {
    title: "Staff & Roles",
    path: "/dashboard/management/staff",
    aliases: ["staff", "roles", "staff and roles", "employees", "team members", "user management"],
    category: "Management",
  },
  {
    title: "Subcontractors",
    path: "/dashboard/management/subcontractors",
    aliases: ["subcontractors", "contractors", "subs"],
    category: "Management",
  },
  {
    title: "Pricing Backend",
    path: "/dashboard/management/pricing",
    aliases: ["pricing backend", "pricing", "price management", "pricing settings"],
    category: "Management",
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

/**
 * Find a route based on a natural language query
 * Uses fuzzy matching to find the best match
 * 
 * @param query - Natural language query (e.g., "show me clients", "go to calendar")
 * @returns RouteAlias if found, null otherwise
 */
export function findRoute(query: string): RouteAlias | null {
  const normalizedQuery = query.toLowerCase().trim()
  
  // First, try exact matches on aliases
  for (const route of DASHBOARD_ROUTES) {
    if (route.aliases.some(alias => normalizedQuery === alias)) {
      return route
    }
  }
  
  // Second, try partial matches (query contains alias or alias contains query)
  for (const route of DASHBOARD_ROUTES) {
    if (route.aliases.some(alias => 
      normalizedQuery.includes(alias) || alias.includes(normalizedQuery)
    )) {
      return route
    }
  }
  
  // Third, try matching against the title
  for (const route of DASHBOARD_ROUTES) {
    const normalizedTitle = route.title.toLowerCase()
    if (normalizedQuery.includes(normalizedTitle) || normalizedTitle.includes(normalizedQuery)) {
      return route
    }
  }
  
  return null
}

/**
 * Get all available route aliases for documentation/help
 * @returns Array of all route titles
 */
export function getAllRouteAliases(): string[] {
  return DASHBOARD_ROUTES.map(route => route.title)
}

/**
 * Get routes grouped by category
 * @returns Record of category name to routes
 */
export function getRoutesByCategory(): Record<string, RouteAlias[]> {
  return DASHBOARD_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = []
    }
    acc[route.category].push(route)
    return acc
  }, {} as Record<string, RouteAlias[]>)
}
