"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Employee, TimeEntry, CreateEmployeeData, CreateTimeEntryData } from "@/lib/labor-types"
import { EMPLOYEE_SEED, TIME_ENTRY_SEED } from "@/lib/labor-seed"

const EMP_STORAGE_KEY = "landscaping-v2-employees"
const TIME_STORAGE_KEY = "landscaping-v2-time-entries"

function loadEmployees(): Employee[] {
  if (typeof window === "undefined") return [...EMPLOYEE_SEED]
  try {
    const raw = localStorage.getItem(EMP_STORAGE_KEY)
    if (!raw || raw === "") return [...EMPLOYEE_SEED]
    const parsed = JSON.parse(raw) as Employee[]
    return Array.isArray(parsed) ? parsed : [...EMPLOYEE_SEED]
  } catch {
    return [...EMPLOYEE_SEED]
  }
}

function loadTimeEntries(): TimeEntry[] {
  if (typeof window === "undefined") return [...TIME_ENTRY_SEED]
  try {
    const raw = localStorage.getItem(TIME_STORAGE_KEY)
    if (!raw || raw === "") return [...TIME_ENTRY_SEED]
    const parsed = JSON.parse(raw) as TimeEntry[]
    return Array.isArray(parsed) ? parsed : [...TIME_ENTRY_SEED]
  } catch {
    return [...TIME_ENTRY_SEED]
  }
}

function saveEmployees(list: Employee[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function saveTimeEntries(list: TimeEntry[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function createId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type LaborStoreValue = {
  employees: Employee[]
  timeEntries: TimeEntry[]
  getEmployee: (id: string) => Employee | undefined
  getTimeEntriesByEmployeeId: (employeeId: string) => TimeEntry[]
  getTimeEntriesByProjectId: (projectId: string) => TimeEntry[]
  getActiveTimeEntry: (employeeId: string) => TimeEntry | undefined
  createEmployee: (data: CreateEmployeeData) => Employee
  updateEmployee: (id: string, data: Partial<CreateEmployeeData>) => void
  deleteEmployee: (id: string) => void
  clockIn: (employeeId: string, projectId: string, gpsVerified?: boolean) => TimeEntry
  clockOut: (timeEntryId: string) => void
  createTimeEntry: (data: CreateTimeEntryData) => TimeEntry
  updateTimeEntry: (id: string, data: Partial<CreateTimeEntryData>) => void
  deleteTimeEntry: (id: string) => void
}

const LaborStoreContext = createContext<LaborStoreValue | null>(null)

export function LaborStoreProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])

  useEffect(() => {
    setEmployees(loadEmployees())
    setTimeEntries(loadTimeEntries())
  }, [])

  const persistEmployees = useCallback((list: Employee[]) => {
    setEmployees(list)
    saveEmployees(list)
  }, [])

  const persistTimeEntries = useCallback((list: TimeEntry[]) => {
    setTimeEntries(list)
    saveTimeEntries(list)
  }, [])

  const getEmployee = useCallback((id: string) => employees.find((e) => e.id === id), [employees])
  const getTimeEntriesByEmployeeId = useCallback(
    (employeeId: string) => timeEntries.filter((t) => t.employeeId === employeeId).sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),
    [timeEntries],
  )
  const getTimeEntriesByProjectId = useCallback(
    (projectId: string) => timeEntries.filter((t) => t.projectId === projectId).sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),
    [timeEntries],
  )
  const getActiveTimeEntry = useCallback(
    (employeeId: string) => timeEntries.find((t) => t.employeeId === employeeId && !t.clockOutAt),
    [timeEntries],
  )

  const createEmployee = useCallback(
    (data: CreateEmployeeData) => {
      const now = new Date().toISOString()
      const employee: Employee = { ...data, id: createId(), createdAt: now, updatedAt: now }
      persistEmployees([...employees, employee])
      return employee
    },
    [employees, persistEmployees],
  )

  const updateEmployee = useCallback(
    (id: string, data: Partial<CreateEmployeeData>) => {
      const now = new Date().toISOString()
      persistEmployees(employees.map((e) => (e.id === id ? { ...e, ...data, updatedAt: now } : e)))
    },
    [employees, persistEmployees],
  )

  const deleteEmployee = useCallback(
    (id: string) => {
      persistEmployees(employees.filter((e) => e.id !== id))
      persistTimeEntries(timeEntries.filter((t) => t.employeeId !== id))
    },
    [employees, timeEntries, persistEmployees, persistTimeEntries],
  )

  const clockIn = useCallback(
    (employeeId: string, projectId: string, gpsVerified = false) => {
      const now = new Date().toISOString()
      const entry: TimeEntry = {
        id: createId(),
        employeeId,
        projectId,
        clockInAt: now,
        clockOutAt: null,
        gpsVerified,
        supervisorOverride: false,
        notes: "",
        createdAt: now,
        updatedAt: now,
      }
      persistTimeEntries([...timeEntries, entry])
      return entry
    },
    [timeEntries, persistTimeEntries],
  )

  const clockOut = useCallback(
    (timeEntryId: string) => {
      const now = new Date().toISOString()
      persistTimeEntries(
        timeEntries.map((t) => (t.id === timeEntryId ? { ...t, clockOutAt: now, updatedAt: now } : t)),
      )
    },
    [timeEntries, persistTimeEntries],
  )

  const createTimeEntry = useCallback(
    (data: CreateTimeEntryData) => {
      const now = new Date().toISOString()
      const entry: TimeEntry = { ...data, id: createId(), createdAt: now, updatedAt: now }
      persistTimeEntries([...timeEntries, entry])
      return entry
    },
    [timeEntries, persistTimeEntries],
  )

  const updateTimeEntry = useCallback(
    (id: string, data: Partial<CreateTimeEntryData>) => {
      const now = new Date().toISOString()
      persistTimeEntries(timeEntries.map((t) => (t.id === id ? { ...t, ...data, updatedAt: now } : t)))
    },
    [timeEntries, persistTimeEntries],
  )

  const deleteTimeEntry = useCallback(
    (id: string) => persistTimeEntries(timeEntries.filter((t) => t.id !== id)),
    [timeEntries, persistTimeEntries],
  )

  const value: LaborStoreValue = {
    employees,
    timeEntries,
    getEmployee,
    getTimeEntriesByEmployeeId,
    getTimeEntriesByProjectId,
    getActiveTimeEntry,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clockIn,
    clockOut,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  }

  return (
    <LaborStoreContext.Provider value={value}>
      {children}
    </LaborStoreContext.Provider>
  )
}

export function useLaborStore(): LaborStoreValue {
  const ctx = useContext(LaborStoreContext)
  if (!ctx) throw new Error("useLaborStore must be used within LaborStoreProvider")
  return ctx
}
