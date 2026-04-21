"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React, { useState, useEffect } from "react"
import { VoiceAssistantButton } from "@/components/dashboard/layout/voice-assistant/voice-assistant-button"
import { SearchButton } from "@/components/dashboard/layout/command-menu/search-button"

export function DashboardHeader() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])


  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean)
  // segments: ['dashboard', 'estimates', 'quick']
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const isLast = index === segments.length - 1
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    
    return { href, title, isLast }
  })

  const dateString = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const timeString = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 px-4 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && (
                  <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto px-4 flex items-center gap-2">
        <span className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 border border-border/50 text-foreground/80 backdrop-blur-sm">
          <span className="font-normal">{dateString}</span>
          <span className="w-px h-3 bg-border/50" />
          <span className="font-mono tabular-nums">{timeString}</span>
        </span>
        <SearchButton />
        <VoiceAssistantButton />
      </div>
    </header>
  )
}

