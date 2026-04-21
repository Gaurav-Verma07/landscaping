"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect } from "react"

/**
 * Forces light theme on non-dashboard pages (landing page, auth pages, etc.)
 * Only allows theme switching on /dashboard routes
 */
export function LandingThemeEnforcer() {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const isDashboard = pathname?.startsWith("/dashboard")

  useEffect(() => {
    if (!isDashboard) {
      // Force light theme on non-dashboard pages
      setTheme("light")
    }
  }, [pathname, isDashboard, setTheme])

  return null
}

