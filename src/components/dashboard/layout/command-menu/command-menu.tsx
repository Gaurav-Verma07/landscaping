"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, Settings, User, Moon, Sun,
  MessageSquare, Mail, PlusCircle, Users,
  FolderKanban, FileText, Receipt, Calendar,
} from "lucide-react"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"
import { useQueryClient } from "@tanstack/react-query"
import { customerKeys } from "@/lib/hooks/use-customers"
import { projectKeys } from "@/lib/hooks/use-projects"
import { billingKeys } from "@/lib/hooks/use-billing"
import { appointmentKeys } from "@/lib/hooks/use-appointments"
import { communicationKeys } from "@/lib/hooks/use-communications"
import { getCustomers } from "@/lib/actions/customers"
import { getProjects } from "@/lib/actions/projects"
import { getQuotes, getInvoices } from "@/lib/actions/billing"
import { getAppointments } from "@/lib/actions/appointments"
import { getCommunications } from "@/lib/actions/communications"
import type { Customer } from "@/types/customer-types"
import type { Project } from "@/types/project-types"
import type { Quote, Invoice } from "@/types/quote-types"
import type { Appointment } from "@/types/appointment-types"
import type { Communication } from "@/types/communication-types"

const LIMIT = { customers: 20, projects: 15, quotes: 10, invoices: 10, appointments: 15 }

interface CommandMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const queryClient = useQueryClient()

  // Local state — only populated when menu opens
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [quotes, setQuotes] = React.useState<Quote[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [communications, setCommunications] = React.useState<Communication[]>([])

  // When menu opens, read from TanStack cache first — only fetch if cache is empty
  React.useEffect(() => {
    if (!open) return

    const load = async () => {
      const [c, p, q, i, a, comms] = await Promise.all([
        queryClient.ensureQueryData({ queryKey: customerKeys.all, queryFn: getCustomers }),
        queryClient.ensureQueryData({ queryKey: projectKeys.all, queryFn: getProjects }),
        queryClient.ensureQueryData({ queryKey: billingKeys.quotes, queryFn: getQuotes }),
        queryClient.ensureQueryData({ queryKey: billingKeys.invoices, queryFn: getInvoices }),
        queryClient.ensureQueryData({ queryKey: appointmentKeys.all, queryFn: getAppointments }),
        queryClient.ensureQueryData({ queryKey: communicationKeys.communications, queryFn: getCommunications }),
      ])
      setCustomers(c)
      setProjects(p)
      setQuotes(q)
      setInvoices(i)
      setAppointments(a)
      setCommunications(comms)
    }

    load()
  }, [open])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  const getCustomerById = (id: string) => customers.find((c) => c.id === id)

  const searchAppointments = React.useMemo(
    () => appointments.slice(0, LIMIT.appointments).sort((a, b) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    ),
    [appointments]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search customers, projects, quotes, invoices, appointments..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Customers">
          {customers.slice(0, LIMIT.customers).map((c) => (
            <CommandItem
              key={`customer-${c.id}`}
              value={`customer ${c.name} ${c.companyName ?? ""} ${c.emails[0] ?? ""} ${c.phones[0] ?? ""} ${c.id}`.toLowerCase()}
              onSelect={() => runCommand(() => router.push(`/dashboard/customers?open=${c.id}`))}
            >
              <Users className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{c.name || c.companyName || c.emails[0] || c.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Projects">
          {projects.slice(0, LIMIT.projects).map((p) => {
            const customer = getCustomerById(p.customerId)
            return (
              <CommandItem
                key={`project-${p.id}`}
                value={`project ${p.name} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${p.id}`.toLowerCase()}
                onSelect={() => runCommand(() => router.push(`/dashboard/projects?open=${p.id}`))}
              >
                <FolderKanban className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{p.name}</span>
                {customer && <span className="ml-1 text-muted-foreground truncate">· {customer.name || customer.companyName}</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandGroup heading="Quotes">
          {quotes.slice(0, LIMIT.quotes).map((q) => {
            const customer = getCustomerById(q.customerId)
            return (
              <CommandItem
                key={`quote-${q.id}`}
                value={`quote ${q.quoteNumber} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${q.id}`.toLowerCase()}
                onSelect={() => runCommand(() => router.push("/dashboard/quotes"))}
              >
                <FileText className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{q.quoteNumber}</span>
                {customer && <span className="ml-1 text-muted-foreground truncate">· {customer.name || customer.companyName}</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandGroup heading="Invoices">
          {invoices.slice(0, LIMIT.invoices).map((inv) => {
            const customer = getCustomerById(inv.customerId)
            return (
              <CommandItem
                key={`invoice-${inv.id}`}
                value={`invoice ${inv.invoiceNumber} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${inv.id}`.toLowerCase()}
                onSelect={() => runCommand(() => router.push(`/dashboard/invoices/${inv.id}`))}
              >
                <Receipt className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{inv.invoiceNumber}</span>
                {customer && <span className="ml-1 text-muted-foreground truncate">· {customer.name || customer.companyName}</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandGroup heading="Appointments">
          {searchAppointments.map((apt) => {
            const customer = getCustomerById(apt.customerId)
            const dateStr = new Date(apt.startAt).toLocaleDateString(undefined, { dateStyle: "short" })
            return (
              <CommandItem
                key={`appointment-${apt.id}`}
                value={`appointment ${dateStr} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${apt.id}`.toLowerCase()}
                onSelect={() => runCommand(() => router.push("/dashboard/appointments"))}
              >
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dateStr}</span>
                {customer && <span className="ml-1 text-muted-foreground truncate">· {customer.name || customer.companyName}</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications"))}>
            <MessageSquare className="mr-2 h-4 w-4" /><span>Communications</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications?create=1"))}>
            <PlusCircle className="mr-2 h-4 w-4" /><span>Create message</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications/settings"))}>
            <Mail className="mr-2 h-4 w-4" /><span>Communication settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/customers"))}>
            <User className="mr-2 h-4 w-4" /><span>Customers</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/management/settings"))}>
            <Settings className="mr-2 h-4 w-4" /><span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" /><span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" /><span>Dark</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}