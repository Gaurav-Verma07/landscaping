"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Settings,
  User,
  Moon,
  Sun,
  MessageSquare,
  Mail,
  PlusCircle,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  Calendar,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useCommunicationStore } from "@/lib/communication-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useProjectStore } from "@/lib/project-store"
import { useBillingStore } from "@/lib/billing-store"
import { useAppointmentStore } from "@/lib/appointment-store"

const GLOBAL_SEARCH_LIMIT = { customers: 20, projects: 15, quotes: 10, invoices: 10, appointments: 15 }

interface CommandMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { communications } = useCommunicationStore()
  const { customers, getCustomer: getCustomerById } = useCustomerStore()
  const { projects, getProject } = useProjectStore()
  const { quotes, invoices } = useBillingStore()
  const { appointments } = useAppointmentStore()

  const searchComms = React.useMemo(() => communications.slice(0, 25), [communications])
  const globalSearchCustomers = React.useMemo(() => customers.slice(0, GLOBAL_SEARCH_LIMIT.customers), [customers])
  const globalSearchProjects = React.useMemo(() => projects.slice(0, GLOBAL_SEARCH_LIMIT.projects), [projects])
  const globalSearchQuotes = React.useMemo(() => quotes.slice(0, GLOBAL_SEARCH_LIMIT.quotes), [quotes])
  const globalSearchInvoices = React.useMemo(() => invoices.slice(0, GLOBAL_SEARCH_LIMIT.invoices), [invoices])
  const globalSearchAppointments = React.useMemo(
    () => appointments.slice(0, GLOBAL_SEARCH_LIMIT.appointments).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [appointments],
  )

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen],
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search customers, projects, quotes, invoices, appointments..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Customers">
          {globalSearchCustomers.map((c) => {
            const searchValue = `customer ${c.name} ${c.companyName ?? ""} ${c.emails[0] ?? ""} ${c.phones[0] ?? ""} ${c.id}`.toLowerCase()
            return (
              <CommandItem
                key={`customer-${c.id}`}
                value={searchValue}
                onSelect={() => runCommand(() => router.push(`/dashboard/customers?open=${c.id}`))}
              >
                <Users className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{c.name || c.companyName || c.emails[0] || c.id}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandGroup heading="Projects">
          {globalSearchProjects.map((p) => {
            const customer = getCustomerById(p.customerId)
            const searchValue = `project ${p.name} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${p.id}`.toLowerCase()
            return (
              <CommandItem
                key={`project-${p.id}`}
                value={searchValue}
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
          {globalSearchQuotes.map((q) => {
            const customer = getCustomerById(q.customerId)
            const searchValue = `quote ${q.quoteNumber} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${q.id}`.toLowerCase()
            return (
              <CommandItem
                key={`quote-${q.id}`}
                value={searchValue}
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
          {globalSearchInvoices.map((inv) => {
            const customer = getCustomerById(inv.customerId)
            const searchValue = `invoice ${inv.invoiceNumber} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${inv.id}`.toLowerCase()
            return (
              <CommandItem
                key={`invoice-${inv.id}`}
                value={searchValue}
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
          {globalSearchAppointments.map((apt) => {
            const customer = getCustomerById(apt.customerId)
            const dateStr = new Date(apt.startAt).toLocaleDateString(undefined, { dateStyle: "short" })
            const searchValue = `appointment ${dateStr} ${customer?.name ?? ""} ${customer?.companyName ?? ""} ${apt.id}`.toLowerCase()
            return (
              <CommandItem
                key={`appointment-${apt.id}`}
                value={searchValue}
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
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Communications</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications?create=1"))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Create message</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/communications/settings"))}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Communication settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/customers"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Customers</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/management/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

