'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  getActiveTimeEntries,
  getTimeEntriesByEmployeeId,
  createEmployee as createEmployeeAction,
  updateEmployee as updateEmployeeAction,
  deleteEmployee as deleteEmployeeAction,
  clockIn as clockInAction,
  clockOut as clockOutAction,
  createTimeEntry as createTimeEntryAction,
  updateTimeEntry as updateTimeEntryAction,
  deleteTimeEntry as deleteTimeEntryAction,
} from '@/lib/actions/labor'
import type { Employee, TimeEntry, CreateEmployeeData, CreateTimeEntryData } from '@/types/labor-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const laborKeys = {
  employees: ['employees'] as const,
  timeEntries: ['time-entries'] as const,
  activeEntries: ['time-entries', 'active'] as const,
  timeEntriesByEmployee: (id: string) => ['time-entries', 'employee', id] as const,
}

export function useEmployees() {
  return useQuery({
    queryKey: laborKeys.employees,
    queryFn: getEmployees,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => createEmployeeAction(data),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.employees })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'employee_created', entityType: 'employee', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEmployeeData> }) =>
      updateEmployeeAction(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.employees })
      void logAudit.mutateAsync({ action: 'employee_updated', entityType: 'employee', entityId: variables.id })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: laborKeys.employees })
      const previous = queryClient.getQueryData<Employee[]>(laborKeys.employees)
      queryClient.setQueryData<Employee[]>(laborKeys.employees, (old) =>
        old?.filter((e) => e.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(laborKeys.employees, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.employees })
      void logAudit.mutateAsync({ action: 'employee_deleted', entityType: 'employee', entityId: id })
    },
  })
}

export function useActiveTimeEntries() {
  return useQuery({
    queryKey: laborKeys.activeEntries,
    queryFn: getActiveTimeEntries,
    refetchInterval: 30_000,
  })
}

export function useTimeEntriesByEmployee(employeeId: string | null) {
  return useQuery({
    queryKey: laborKeys.timeEntriesByEmployee(employeeId ?? ''),
    queryFn: () => getTimeEntriesByEmployeeId(employeeId!),
    enabled: !!employeeId,
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({
      employeeId,
      projectId,
      gpsVerified = false,
      gpsData,
      notes,
    }: {
      employeeId: string
      projectId: string
      gpsVerified?: boolean
      gpsData?: { lat: number; lng: number; accuracyMeters: number; distanceMeters: number | null }
      notes?: string
    }) => clockInAction(employeeId, projectId, gpsVerified, gpsData, notes),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries })
      void queryClient.invalidateQueries({ queryKey: laborKeys.activeEntries })
      void logAudit.mutateAsync({ action: 'employee_clocked_in', entityType: 'employee', entityId: variables.employeeId, details: `Project: ${variables.projectId}` })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (timeEntryId: string) => clockOutAction(timeEntryId),
    onSuccess: (_result, timeEntryId) => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries })
      void queryClient.invalidateQueries({ queryKey: laborKeys.activeEntries })
      void logAudit.mutateAsync({ action: 'employee_clocked_out', entityType: 'employee', entityId: timeEntryId })
    },
  })
}

export function useSupervisorOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ timeEntryId, reason }: { timeEntryId: string; reason: string }) =>
      clockOutAction(timeEntryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.activeEntries })
      void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries })
    },
  })
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => createTimeEntryAction(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries })
      void queryClient.invalidateQueries({ queryKey: laborKeys.activeEntries })
    },
  })
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTimeEntryData> }) =>
      updateTimeEntryAction(id, data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTimeEntryAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: laborKeys.timeEntries })
      const previous = queryClient.getQueryData<TimeEntry[]>(laborKeys.timeEntries)
      queryClient.setQueryData<TimeEntry[]>(laborKeys.timeEntries, (old) =>
        old?.filter((t) => t.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(laborKeys.timeEntries, ctx.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useLaborStore() {
  const queryClient = useQueryClient()
  const { data: employees = [], isLoading: loading } = useEmployees()
  const { data: activeEntries = [] } = useActiveTimeEntries()

  const createEmployeeMutation = useCreateEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()
  const createTimeEntryMutation = useCreateTimeEntry()
  const updateTimeEntryMutation = useUpdateTimeEntry()
  const deleteTimeEntryMutation = useDeleteTimeEntry()

  return {
    employees,
    timeEntries: [] as TimeEntry[],
    loading,

    getEmployee: (id: string) => employees.find((e) => e.id === id),

    getActiveTimeEntry: (employeeId: string) =>
      activeEntries.find((t) => t.employeeId === employeeId) ?? null,

    getTimeEntriesByEmployeeId: (_employeeId: string) => [] as TimeEntry[],

    createEmployee: async (data: CreateEmployeeData) => {
      const result = await createEmployeeMutation.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<Employee[]>(laborKeys.employees)
      return updated?.find((e) => e.id === (result as { data?: { id: string } }).data?.id)
    },

    updateEmployee: (id: string, data: Partial<CreateEmployeeData>) =>
      updateEmployeeMutation.mutateAsync({ id, data }).then(() => {}),

    deleteEmployee: (id: string) => deleteEmployeeMutation.mutateAsync(id).then(() => {}),

    clockIn: async (employeeId: string, projectId: string, gpsVerified = false) => {
      const result = await clockInMutation.mutateAsync({ employeeId, projectId, gpsVerified })
      if ('error' in result) return undefined
      return (result as { data?: TimeEntry }).data
    },

    clockOut: (timeEntryId: string) => clockOutMutation.mutateAsync(timeEntryId).then(() => {}),

    createTimeEntry: async (data: CreateTimeEntryData) => {
      const result = await createTimeEntryMutation.mutateAsync(data)
      if ('error' in result) return undefined
      return (result as { data?: TimeEntry }).data
    },

    updateTimeEntry: (id: string, data: Partial<CreateTimeEntryData>) =>
      updateTimeEntryMutation.mutateAsync({ id, data }).then(() => {}),

    deleteTimeEntry: (id: string) => deleteTimeEntryMutation.mutateAsync(id).then(() => {}),

    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: laborKeys.employees }),
        queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
        queryClient.invalidateQueries({ queryKey: laborKeys.activeEntries }),
      ]).then(() => {}),
  }
}