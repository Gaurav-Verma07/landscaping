"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Users, FolderKanban, DollarSign, Calendar,
  TrendingUp, AlertTriangle, CheckCircle2, Circle,
  ArrowRight, Activity, UserCheck, MapPin,
  ClipboardList, Timer, Leaf
} from "lucide-react"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useProjects } from "@/lib/hooks/use-projects"
import { useQuotes, useInvoices } from "@/lib/hooks/use-billing"
import { useAppointments } from "@/lib/hooks/use-appointments"
import { useEmployees, useActiveTimeEntries } from "@/lib/hooks/use-labor"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/utils/utils"
import { SectionHeader, StatCard, StatusDot } from "./state-cards"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function isToday(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
}

function isThisWeek(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  const startOfWeek = new Date(n)
  startOfWeek.setDate(n.getDate() - n.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return d >= startOfWeek && d < endOfWeek
}


export default function DashboardPage() {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers()
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: quotes = [], isLoading: loadingQuotes } = useQuotes()
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices()
  const { data: appointments = [], isLoading: loadingAppts } = useAppointments()
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees()
  const { data: activeEntries = [], isLoading: loadingActive } = useActiveTimeEntries()

  // ── Derived KPIs ──
  const kpis = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === "Active").length
    const leads = customers.filter(c => c.status === "Lead").length

    const inProgress = projects.filter(p => p.status === "In Progress")
    const scheduled = projects.filter(p => p.status === "Scheduled")
    const awaitingDeposit = projects.filter(p => p.status === "Awaiting Deposit")
    const completedThisMonth = projects.filter(p => {
      if (p.status !== "Completed") return false
      const d = new Date(p.updatedAt)
      const n = new Date()
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
    })

    const pendingQuotes = quotes.filter(q => q.status === "sent")
    const acceptedQuotes = quotes.filter(q => q.status === "accepted")
    const pendingQuoteValue = pendingQuotes.reduce((s, q) => s + q.total, 0)

    const overdueInvoices = invoices.filter(i => i.status === "overdue")
    const outstandingInvoices = invoices.filter(i => ["sent", "partial", "overdue"].includes(i.status))
    const outstandingValue = outstandingInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0)
    const paidThisMonth = invoices
      .filter(i => i.status === "paid")
      .filter(i => {
        const d = new Date(i.updatedAt)
        const n = new Date()
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
      })
      .reduce((s, i) => s + i.total, 0)

    const todayAppts = appointments.filter(a => isToday(a.startAt))
    const weekAppts = appointments.filter(a => isThisWeek(a.startAt))

    return {
      activeCustomers, leads,
      inProgress, scheduled, awaitingDeposit, completedThisMonth,
      pendingQuotes, acceptedQuotes, pendingQuoteValue,
      overdueInvoices, outstandingValue, paidThisMonth,
      todayAppts, weekAppts,
      activeCrew: activeEntries.length,
      totalEmployees: employees.length,
    }
  }, [customers, projects, quotes, invoices, appointments, employees, activeEntries])

  // ── Recent Items ──
  const recentCustomers = useMemo(
    () => [...customers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [customers]
  )

  const activeProjects = useMemo(
    () => projects.filter(p => ["In Progress", "Scheduled", "Materials Ordered"].includes(p.status)).slice(0, 6),
    [projects]
  )

  const upcomingAppts = useMemo(
    () => [...appointments]
      .filter(a => new Date(a.startAt) >= new Date())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5),
    [appointments]
  )

  const recentQuotes = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [quotes]
  )

  const urgentInvoices = useMemo(
    () => [...invoices]
      .filter(i => ["overdue", "sent"].includes(i.status))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5),
    [invoices]
  )

  const projectsByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    projects.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1 })
    return counts
  }, [projects])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-semibold tracking-tight">Operations Dashboard</h1>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Users}
          label="Active Customers"
          value={loadingCustomers ? "—" : kpis.activeCustomers}
          sub={`${kpis.leads} leads`}
          accent="bg-sky-100 dark:bg-sky-950"
          href="/dashboard/customers"
          loading={loadingCustomers}
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={loadingProjects ? "—" : kpis.inProgress.length + kpis.scheduled.length}
          sub={`${kpis.awaitingDeposit.length} awaiting deposit`}
          accent="bg-violet-100 dark:bg-violet-950"
          href="/dashboard/projects"
          loading={loadingProjects}
        />
        <StatCard
          icon={DollarSign}
          label="Outstanding"
          value={loadingInvoices ? "—" : fmt(kpis.outstandingValue)}
          sub={`${kpis.overdueInvoices.length} overdue`}
          accent={kpis.overdueInvoices.length > 0 ? "bg-red-100 dark:bg-red-950" : "bg-emerald-100 dark:bg-emerald-950"}
          href="/dashboard/invoices"
          loading={loadingInvoices}
        />
        <StatCard
          icon={TrendingUp}
          label="Paid This Month"
          value={loadingInvoices ? "—" : fmt(kpis.paidThisMonth)}
          sub={`${kpis.pendingQuotes.length} quotes pending`}
          accent="bg-emerald-100 dark:bg-emerald-950"
          href="/dashboard/quotes"
          loading={loadingInvoices}
        />
        <StatCard
          icon={Calendar}
          label="Today's Appointments"
          value={loadingAppts ? "—" : kpis.todayAppts.length}
          sub={`${kpis.weekAppts.length} this week`}
          accent="bg-amber-100 dark:bg-amber-950"
          href="/dashboard/appointments"
          loading={loadingAppts}
        />
        <StatCard
          icon={Activity}
          label="Crew On-Site"
          value={loadingActive ? "—" : kpis.activeCrew}
          sub={`of ${kpis.totalEmployees} employees`}
          accent={kpis.activeCrew > 0 ? "bg-rose-100 dark:bg-rose-950" : "bg-zinc-100 dark:bg-zinc-800"}
          href="/dashboard/crew"
          loading={loadingActive || loadingEmployees}
        />
      </div>

      {/* ── Project Pipeline + Active Projects ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Pipeline by Status */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Project Pipeline" href="/dashboard/projects" />
          <div className="flex flex-col gap-3">
            {loadingProjects
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))
              : [
                  "In Progress",
                  "Scheduled",
                  "Materials Ordered",
                  "Awaiting Deposit",
                  "Planned",
                  "Inspection",
                  "Completed",
                ].map(status => {
                  const count = projectsByStatus[status] ?? 0
                  const max = Math.max(...Object.values(projectsByStatus), 1)
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-36 flex-shrink-0">
                        <StatusDot status={status} />
                        <span className="text-xs text-muted-foreground truncate">{status}</span>
                      </div>
                      <Progress value={(count / max) * 100} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium w-4 text-right">{count}</span>
                    </div>
                  )
                })}
          </div>
          {!loadingProjects && (
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total projects</span>
              <span className="text-sm font-semibold">{projects.length}</span>
            </div>
          )}
        </div>

        {/* Active Projects List */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Active Projects" href="/dashboard/projects" count={kpis.inProgress.length + kpis.scheduled.length} />
          <div className="flex flex-col gap-2">
            {loadingProjects
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              : activeProjects.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <FolderKanban className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No active projects</p>
                </div>
              )
              : activeProjects.map(p => {
                  const completedMilestones = p.timeline?.filter(m => m.completedAt).length ?? 0
                  const totalMilestones = p.timeline?.length ?? 0
                  const pct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
                  return (
                    <Link key={p.id} href={`/dashboard/projects`}>
                      <div className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                        <StatusDot status={p.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.projectType}</p>
                        </div>
                        {totalMilestones > 0 && (
                          <div className="flex items-center gap-2 w-24">
                            <Progress value={pct} className="h-1 flex-1" />
                            <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:flex">
                          {p.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {p.status}
                        </Badge>
                      </div>
                    </Link>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* ── Middle Row: Appointments + Quotes + Invoices ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Upcoming Appointments */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Upcoming Appointments" href="/dashboard/appointments" count={upcomingAppts.length} />
          <div className="flex flex-col gap-2">
            {loadingAppts
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              : upcomingAppts.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <Calendar className="h-7 w-7 opacity-30" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              )
              : upcomingAppts.map(a => {
                  const today = isToday(a.startAt)
                  return (
                    <div key={a.id} className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 transition-colors",
                      today ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" : "hover:bg-muted/30"
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          {new Date(a.startAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {today && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white">Today</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {" → "}
                        {new Date(a.endAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {a.address && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{a.address}</span>
                        </div>
                      )}
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Recent Quotes" href="/dashboard/quotes" count={kpis.pendingQuotes.length} />
          <div className="flex flex-col gap-2">
            {loadingQuotes
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : recentQuotes.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <ClipboardList className="h-7 w-7 opacity-30" />
                  <p className="text-sm">No quotes yet</p>
                </div>
              )
              : recentQuotes.map(q => (
                  <div key={q.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <StatusDot status={q.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{q.quoteNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(q.updatedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(q.total)}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{q.status}</Badge>
                    </div>
                  </div>
                ))
            }
          </div>
          {!loadingQuotes && kpis.pendingQuoteValue > 0 && (
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pending pipeline</span>
              <span className="text-sm font-semibold text-blue-600">{fmt(kpis.pendingQuoteValue)}</span>
            </div>
          )}
        </div>

        {/* Invoices Requiring Attention */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Invoices — Action Needed" href="/dashboard/invoices" />
          <div className="flex flex-col gap-2">
            {loadingInvoices
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : urgentInvoices.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 opacity-30 text-emerald-500" />
                  <p className="text-sm">All invoices are up to date</p>
                </div>
              )
              : urgentInvoices.map(inv => {
                  const remaining = inv.total - inv.paidAmount
                  const isOverdue = inv.status === "overdue"
                  return (
                    <div key={inv.id} className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isOverdue ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900" : "hover:bg-muted/30"
                    )}>
                      {isOverdue
                        ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        : <StatusDot status={inv.status} />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-muted-foreground">Due {fmtDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmt(remaining)}</p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 capitalize", isOverdue && "border-red-400 text-red-600")}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })
            }
          </div>
          {!loadingInvoices && kpis.outstandingValue > 0 && (
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total outstanding</span>
              <span className={cn("text-sm font-semibold", kpis.overdueInvoices.length > 0 ? "text-red-600" : "text-foreground")}>
                {fmt(kpis.outstandingValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Crew + Customers ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Live Crew */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Crew Status" href="/dashboard/crew" />
          <div className="flex items-center gap-6 pb-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold">{kpis.activeCrew} clocked in</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span className="text-xs">{kpis.totalEmployees - kpis.activeCrew} available</span>
            </div>
          </div>

          {loadingActive || loadingEmployees
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)
            : activeEntries.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <UserCheck className="h-7 w-7 opacity-30" />
                <p className="text-sm">No crew currently on site</p>
              </div>
            )
            : activeEntries.slice(0, 6).map(entry => {
                const employee = employees.find(e => e.id === entry.employeeId)
                const hoursWorked = ((Date.now() - new Date(entry.clockInAt).getTime()) / 3_600_000).toFixed(1)
                return (
                  <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                      {employee?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{employee?.name ?? "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {employee?.role} · {entry.gpsVerified ? "GPS ✓" : entry.supervisorOverride ? "Override" : "GPS ?"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{hoursWorked}h</p>
                      <p className="text-[10px] text-muted-foreground">
                        since {new Date(entry.clockInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Recent Customers */}
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
          <SectionHeader title="Recent Customers" href="/dashboard/customers" count={customers.length} />
          <div className="flex flex-col gap-2">
            {loadingCustomers
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : recentCustomers.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <Users className="h-7 w-7 opacity-30" />
                  <p className="text-sm">No customers yet</p>
                </div>
              )
              : recentCustomers.map(c => (
                  <Link key={c.id} href="/dashboard/customers">
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950 text-xs font-semibold text-sky-700 dark:text-sky-300 flex-shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.companyName || c.emails[0] || c.phones[0] || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
          {!loadingCustomers && (
            <div className="border-t pt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Leads", value: customers.filter(c => c.status === "Lead").length, color: "text-sky-600" },
                { label: "Active", value: customers.filter(c => c.status === "Active").length, color: "text-emerald-600" },
                { label: "Maintenance", value: customers.filter(c => c.status === "Maintenance").length, color: "text-amber-600" },
              ].map(s => (
                <div key={s.label}>
                  <p className={cn("text-lg font-semibold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Alerts Banner ── */}
      {!loadingInvoices && !loadingProjects && (
        <div className="flex flex-col gap-2">
          {kpis.overdueInvoices.length > 0 && (
            <Link href="/dashboard/invoices">
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-4 py-3 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  {kpis.overdueInvoices.length} overdue invoice{kpis.overdueInvoices.length > 1 ? "s" : ""} — {fmt(kpis.overdueInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0))} outstanding
                </p>
                <ArrowRight className="h-4 w-4 text-red-500 ml-auto" />
              </div>
            </Link>
          )}
          {kpis.awaitingDeposit.length > 0 && (
            <Link href="/dashboard/projects">
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors">
                <Circle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  {kpis.awaitingDeposit.length} project{kpis.awaitingDeposit.length > 1 ? "s" : ""} awaiting deposit
                </p>
                <ArrowRight className="h-4 w-4 text-amber-500 ml-auto" />
              </div>
            </Link>
          )}
          {kpis.completedThisMonth.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {kpis.completedThisMonth.length} project{kpis.completedThisMonth.length > 1 ? "s" : ""} completed this month 🎉
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}