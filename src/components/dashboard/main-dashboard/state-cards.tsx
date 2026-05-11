// ─── Sub-components ───────────────────────────────────────────────────────────

import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/utils/utils"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
    href,
    loading,
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    sub?: string
    accent?: string
    href?: string
    loading?: boolean
  }) {
    const inner = (
      <div className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all",
        href && "cursor-pointer hover:shadow-md hover:border-foreground/20"
      )}>
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            accent ?? "bg-muted"
          )}>
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          {href && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        {loading ? (
          <>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </div>
    )
    return href ? <Link href={href}>{inner}</Link> : inner
  }
  
export function SectionHeader({
    title,
    href,
    count,
  }: {
    title: string
    href?: string
    count?: number
  }) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {count}
            </Badge>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    )
  }
  
export function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
      "In Progress": "bg-blue-500",
      Scheduled: "bg-violet-500",
      Planned: "bg-zinc-400",
      "Awaiting Deposit": "bg-amber-500",
      "Materials Ordered": "bg-orange-500",
      Inspection: "bg-cyan-500",
      Completed: "bg-emerald-500",
      active: "bg-emerald-500",
      Lead: "bg-sky-500",
      Active: "bg-emerald-500",
      Past: "bg-zinc-400",
      Maintenance: "bg-amber-500",
      accepted: "bg-emerald-500",
      sent: "bg-blue-500",
      draft: "bg-zinc-400",
      rejected: "bg-red-500",
      paid: "bg-emerald-500",
      partial: "bg-amber-500",
      overdue: "bg-red-500",
    }
    return (
      <span className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", colors[status] ?? "bg-zinc-400")} />
    )
  }