"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Calculator,
  Calendar,
  LayoutDashboard,
  Settings,
  User,
  Moon,
  Sun,
  FileText,
  MessageSquare,
  Mail,
  PlusCircle,
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

interface CommandMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { communications } = useCommunicationStore()
  const searchComms = React.useMemo(
    () => communications.slice(0, 25),
    [communications]
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

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/estimates/quick"))}>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Quick Quote</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/estimates/full"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Estimate</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Communications">
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
        </CommandGroup>
        {searchComms.length > 0 && (
          <CommandGroup heading="Search communications">
            {searchComms.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.subject} ${c.contactName} ${c.body.slice(0, 100)} ${c.contactEmail ?? ""} ${c.contactPhone ?? ""}`}
                onSelect={() => runCommand(() => router.push(`/dashboard/communications?open=${c.id}`))}
              >
                <span className="truncate">
                  {c.channel === "email" && c.subject ? c.subject : c.channel === "sms" ? "SMS" : "Call"} · {c.contactName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/customers"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Customers</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/schedule/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
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

