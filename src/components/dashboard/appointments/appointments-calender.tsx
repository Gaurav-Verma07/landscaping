"use client"

import { useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconUsers,
  IconTool,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Appointment } from "@/types/appointment-types"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomerLike { id: string; name?: string; companyName?: string }
interface ProjectLike  { id: string; name: string }

interface AppointmentCalendarViewProps {
  appointments: Appointment[]
  weekStart: Date
  onWeekChange: (dir: 1 | -1) => void
  onGoToToday:  () => void
  getCustomer: (id: string) => CustomerLike | undefined
  getProject:  (id: string) => ProjectLike  | undefined
  onEdit:      (apt: Appointment) => void
  onDelete:    (id: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64 // px per hour
const DAY_START   = 0  // 07:00
const DAY_END     = 24 // 20:00
const TOTAL_HOURS = DAY_END - DAY_START

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function getAptStatus(apt: Appointment): "past" | "today-past" | "upcoming" | "ongoing" | "urgent" {
  const now   = new Date()
  const start = new Date(apt.startAt)
  const end   = new Date(apt.endAt)
  if (end < now) return "past"
  if (start < now && end > now) return "ongoing"
  const diffMs = start.getTime() - now.getTime()
  const diffH  = diffMs / 36e5
  if (diffH <= 2 && diffH > 0) return "urgent"
  return "upcoming"
}

const STATUS_STYLES = {
  past:        { bar: "bg-muted-foreground/40",  card: "bg-muted/50 border-muted-foreground/20 opacity-70",       badge: "bg-muted text-muted-foreground",              label: "Done" },
  "today-past":{ bar: "bg-muted-foreground/40",  card: "bg-muted/50 border-muted-foreground/20 opacity-70",       badge: "bg-muted text-muted-foreground",              label: "Done" },
  ongoing:     { bar: "bg-emerald-500",           card: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", label: "In Progress" },
  urgent:      { bar: "bg-amber-500",             card: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",         badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",         label: "Soon" },
  upcoming:    { bar: "bg-primary",               card: "bg-card border-border",                                   badge: "bg-primary/10 text-primary",                  label: "Scheduled" },
}

function minutesFromDayStart(date: Date): number {
  return (date.getHours() - DAY_START) * 60 + date.getMinutes()
}

function topPct(start: Date): number {
  return (minutesFromDayStart(start) / (TOTAL_HOURS * 60)) * 100
}

function heightPct(start: Date, end: Date): number {
  const dur = (end.getTime() - start.getTime()) / 60000
  return (Math.max(dur, 30) / (TOTAL_HOURS * 60)) * 100
}

// ─── Appointment Card (calendar) ─────────────────────────────────────────────

function CalendarAptCard({
  apt,
  customer,
  project,
  onEdit,
}: {
  apt: Appointment
  customer?: CustomerLike
  project?: ProjectLike
  onEdit: (apt: Appointment) => void
}) {
  const start  = new Date(apt.startAt)
  const end    = new Date(apt.endAt)
  const status = getAptStatus(apt)
  const style  = STATUS_STYLES[status]
  const top    = topPct(start)
  const height = heightPct(start, end)
  const shortName = customer?.name ?? customer?.companyName ?? "Unknown"
  const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border cursor-pointer select-none transition-all hover:shadow-md hover:z-20 group ${style.card}`}
      style={{ top: `${top}%`, height: `${height}%`, minHeight: 28 }}
      onClick={() => onEdit(apt)}
    >
      {/* accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${style.bar}`} />

      <div className="pl-2.5 pr-1.5 py-1 h-full flex flex-col gap-0.5 overflow-hidden">
        <span className="text-[11px] text-muted-foreground font-medium leading-none">{timeLabel}</span>
        <span className="text-[12px] font-semibold leading-tight truncate">{shortName}</span>
        {project && (
          <span className="text-[10px] text-muted-foreground truncate leading-none">{project.name}</span>
        )}
        {height > 12 && (
          <span className={`mt-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full self-start ${style.badge}`}>
            {style.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Hour Rows ────────────────────────────────────────────────────────────────

function HourGrid() {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START + i)
  return (
    <div className="absolute inset-0 pointer-events-none">
      {hours.map((h) => (
        <div
          key={h}
          className="absolute w-full border-t border-border/40"
          style={{ top: `${((h - DAY_START) / TOTAL_HOURS) * 100}%` }}
        />
      ))}
    </div>
  )
}

// ─── Now Indicator ────────────────────────────────────────────────────────────

function NowIndicator() {
  const now = new Date()
  if (now.getHours() < DAY_START || now.getHours() >= DAY_END) return null
  const pct = topPct(now)
  return (
    <div
      className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
      style={{ top: `${pct}%` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
      <div className="flex-1 border-t border-red-500" />
    </div>
  )
}

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({
  date,
  apts,
  getCustomer,
  getProject,
  onEdit,
}: {
  date: Date
  apts: Appointment[]
  getCustomer: (id: string) => CustomerLike | undefined
  getProject:  (id: string) => ProjectLike  | undefined
  onEdit: (apt: Appointment) => void
}) {
  const isToday = isSameDay(date, new Date())
  const dayApts = apts.filter((a) => isSameDay(new Date(a.startAt), date))

  return (
    <div className="relative flex-1 min-w-0" style={{ height: HOUR_HEIGHT * TOTAL_HOURS }}>
      {isToday && <NowIndicator />}
      <HourGrid />
      {dayApts.map((apt) => (
        <CalendarAptCard
          key={apt.id}
          apt={apt}
          customer={getCustomer(apt.customerId)}
          project={apt.projectId ? getProject(apt.projectId) : undefined}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AppointmentCalendarView({
  appointments,
  weekStart,
  onWeekChange,
  onGoToToday,
  getCustomer,
  getProject,
  onEdit,
}: AppointmentCalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()
  const weekEnd = addDays(weekStart, 6)

  // Scroll to 08:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT * (8 - DAY_START)
    }
  }, [])

  const weekLabel = (() => {
    const startLabel = weekStart.toLocaleDateString([], { month: "short", day: "numeric" })
    const endLabel   = weekEnd.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    return `${startLabel} – ${endLabel}`
  })()

  const todayCount = appointments.filter((a) => isSameDay(new Date(a.startAt), today)).length

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START + i)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onWeekChange(-1)}>
            <IconChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold">{weekLabel}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onWeekChange(1)}>
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={onGoToToday}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {todayCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {todayCount} appointment{todayCount !== 1 ? "s" : ""} today
            </Badge>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Soon</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Scheduled</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" /> Past</span>
          </div>
        </div>
      </div>

      {/* ── Day headers ── */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
        <div className="border-r border-border" />
        {days.map((d) => {
          const isToday = isSameDay(d, today)
          return (
            <div
              key={d.toISOString()}
              className={`py-2 text-center border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {d.toLocaleDateString([], { weekday: "short" })}
              </div>
              <div className={`text-lg font-bold leading-tight ${isToday ? "text-primary" : ""}`}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Time grid + content ── */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)", minHeight: 400 }}>
        <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: HOUR_HEIGHT * TOTAL_HOURS }}>
          {/* Time labels */}
          <div className="relative border-r border-border">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: `${((h - DAY_START) / TOTAL_HOURS) * 100}%`, height: `${100 / TOTAL_HOURS}%` }}
              >
                <span className="text-[10px] text-muted-foreground -translate-y-1/2">
                  {h.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => (
            <div key={d.toISOString()} className={`relative border-r border-border last:border-r-0 ${isSameDay(d, today) ? "bg-primary/[0.02]" : ""}`}>
              <DayColumn
                date={d}
                apts={appointments}
                getCustomer={getCustomer}
                getProject={getProject}
                onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}