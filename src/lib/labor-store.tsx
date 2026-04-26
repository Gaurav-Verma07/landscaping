'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Employee, TimeEntry, CreateEmployeeData, CreateTimeEntryData } from '@/lib/labor-types'
import {
  getEmployees, getActiveTimeEntry as getActiveTimeEntryAction,
  getTimeEntriesByEmployeeId as getByEmployeeIdAction,
  getTimeEntriesByProjectId as getByProjectIdAction,
  createEmployee as createEmployeeAction,
  updateEmployee as updateEmployeeAction,
  deleteEmployee as deleteEmployeeAction,
  clockIn as clockInAction, clockOut as clockOutAction,
  createTimeEntry as createTimeEntryAction,
  updateTimeEntry as updateTimeEntryAction,
  deleteTimeEntry as deleteTimeEntryAction,
} from '@/lib/actions/labor'

type LaborStoreValue = {
  employees: Employee[]
  timeEntries: TimeEntry[]
  loading: boolean
  getEmployee: (id: string) => Employee | undefined
  getTimeEntriesByEmployeeId: (employeeId: string) => TimeEntry[]
  getTimeEntriesByProjectId: (projectId: string) => TimeEntry[]
  getActiveTimeEntry: (employeeId: string) => TimeEntry | undefined
  createEmployee: (data: CreateEmployeeData) => Promise<Employee | undefined>
  updateEmployee: (id: string, data: Partial<CreateEmployeeData>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  clockIn: (employeeId: string, projectId: string, gpsVerified?: boolean) => Promise<TimeEntry | undefined>
  clockOut: (timeEntryId: string) => Promise<void>
  createTimeEntry: (data: CreateTimeEntryData) => Promise<TimeEntry | undefined>
  updateTimeEntry: (id: string, data: Partial<CreateTimeEntryData>) => Promise<void>
  deleteTimeEntry: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const LaborStoreContext = createContext<LaborStoreValue | null>(null)

export function LaborStoreProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [emps, entries] = await Promise.all([
      getEmployees(),
      getByProjectIdAction('').catch(() => [] as TimeEntry[]),
    ])
    setEmployees(emps)
    setTimeEntries(entries)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const getEmployee = useCallback((id: string) => employees.find((e) => e.id === id), [employees])

  const getTimeEntriesByEmployeeId = useCallback(
    (employeeId: string) =>
      timeEntries
        .filter((t) => t.employeeId === employeeId)
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),
    [timeEntries]
  )

  const getTimeEntriesByProjectId = useCallback(
    (projectId: string) =>
      timeEntries
        .filter((t) => t.projectId === projectId)
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),
    [timeEntries]
  )

  const getActiveTimeEntry = useCallback(
    (employeeId: string) => timeEntries.find((t) => t.employeeId === employeeId && !t.clockOutAt),
    [timeEntries]
  )

  const createEmployee = useCallback(async (data: CreateEmployeeData) => {
    const result = await createEmployeeAction(data)
    if ('error' in result) return undefined
    await refresh()
    return employees.find((e) => e.id === result.data?.id)
  }, [employees, refresh])

  const updateEmployee = useCallback(async (id: string, data: Partial<CreateEmployeeData>) => {
    await updateEmployeeAction(id, data)
    await refresh()
  }, [refresh])

  const deleteEmployee = useCallback(async (id: string) => {
    await deleteEmployeeAction(id)
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setTimeEntries((prev) => prev.filter((t) => t.employeeId !== id))
  }, [])

  const clockIn = useCallback(async (employeeId: string, projectId: string, gpsVerified = false) => {
    const result = await clockInAction(employeeId, projectId, gpsVerified)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const clockOut = useCallback(async (timeEntryId: string) => {
    await clockOutAction(timeEntryId)
    await refresh()
  }, [refresh])

  const createTimeEntry = useCallback(async (data: CreateTimeEntryData) => {
    const result = await createTimeEntryAction(data)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateTimeEntry = useCallback(async (id: string, data: Partial<CreateTimeEntryData>) => {
    await updateTimeEntryAction(id, data)
    await refresh()
  }, [refresh])

  const deleteTimeEntry = useCallback(async (id: string) => {
    await deleteTimeEntryAction(id)
    setTimeEntries((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: LaborStoreValue = {
    employees, timeEntries, loading,
    getEmployee, getTimeEntriesByEmployeeId, getTimeEntriesByProjectId, getActiveTimeEntry,
    createEmployee, updateEmployee, deleteEmployee,
    clockIn, clockOut, createTimeEntry, updateTimeEntry, deleteTimeEntry,
    refresh,
  }

  return <LaborStoreContext.Provider value={value}>{children}</LaborStoreContext.Provider>
}

export function useLaborStore(): LaborStoreValue {
  const ctx = useContext(LaborStoreContext)
  if (!ctx) throw new Error('useLaborStore must be used within LaborStoreProvider')
  return ctx
}