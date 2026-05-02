'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
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

export const laborKeys = {
  employees: ['employees'] as const,
  timeEntries: ['time-entries'] as const,
}

export function useEmployees() {
  return useQuery({
    queryKey: laborKeys.employees,
    queryFn: getEmployees,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => createEmployeeAction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.employees }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEmployeeData> }) =>
      updateEmployeeAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.employees }),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: laborKeys.employees }),
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      projectId,
      gpsVerified = false,
    }: {
      employeeId: string
      projectId: string
      gpsVerified?: boolean
    }) => clockInAction(employeeId, projectId, gpsVerified),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (timeEntryId: string) => clockOutAction(timeEntryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => createTimeEntryAction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTimeEntryData> }) =>
      updateTimeEntryAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
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
        old?.filter((t) => t.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(laborKeys.timeEntries, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useLaborStore() {
  const queryClient = useQueryClient()
  const { data: employees = [], isLoading: loading } = useEmployees()

  // Time entries are loaded on-demand per employee/project in the original store
  // Keep as empty array here — components that need them fetch via actions directly
  const timeEntries: TimeEntry[] = []

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
    timeEntries,
    loading,

    getEmployee: (id: string) => employees.find((e) => e.id === id),

    getTimeEntriesByEmployeeId: (employeeId: string) =>
      timeEntries
        .filter((t) => t.employeeId === employeeId)
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),

    getTimeEntriesByProjectId: (projectId: string) =>
      timeEntries
        .filter((t) => t.projectId === projectId)
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()),

    getActiveTimeEntry: (employeeId: string) =>
      timeEntries.find((t) => t.employeeId === employeeId && !t.clockOutAt),

    createEmployee: async (data: CreateEmployeeData) => {
      const result = await createEmployeeMutation.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<Employee[]>(laborKeys.employees)
      return updated?.find((e) => e.id === (result as any).data?.id)
    },

    updateEmployee: (id: string, data: Partial<CreateEmployeeData>) =>
      updateEmployeeMutation.mutateAsync({ id, data }).then(() => {}),

    deleteEmployee: (id: string) => deleteEmployeeMutation.mutateAsync(id).then(() => {}),

    clockIn: async (employeeId: string, projectId: string, gpsVerified = false) => {
      const result = await clockInMutation.mutateAsync({ employeeId, projectId, gpsVerified })
      if ('error' in result) return undefined
      return (result as any).data as TimeEntry | undefined
    },

    clockOut: (timeEntryId: string) => clockOutMutation.mutateAsync(timeEntryId).then(() => {}),

    createTimeEntry: async (data: CreateTimeEntryData) => {
      const result = await createTimeEntryMutation.mutateAsync(data)
      if ('error' in result) return undefined
      return (result as any).data as TimeEntry | undefined
    },

    updateTimeEntry: (id: string, data: Partial<CreateTimeEntryData>) =>
      updateTimeEntryMutation.mutateAsync({ id, data }).then(() => {}),

    deleteTimeEntry: (id: string) => deleteTimeEntryMutation.mutateAsync(id).then(() => {}),

    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: laborKeys.employees }),
        queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries }),
      ]).then(() => {}),
  }
}