'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAppointments,
  createAppointment as createAction,
  updateAppointment as updateAction,
  deleteAppointment as deleteAction,
} from '@/lib/actions/appointments'
import type { Appointment, CreateAppointmentData } from '@/types/appointment-types'

export const appointmentKeys = {
  all: ['appointments'] as const,
}

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.all,
    queryFn: getAppointments,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAppointmentData) => createAction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAppointmentData> }) =>
      updateAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.all })
      const previous = queryClient.getQueryData<Appointment[]>(appointmentKeys.all)
      queryClient.setQueryData<Appointment[]>(appointmentKeys.all, (old) =>
        old?.filter((a) => a.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(appointmentKeys.all, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useAppointmentStore() {
  const queryClient = useQueryClient()
  const { data: appointments = [], isLoading: loading } = useAppointments()
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()
  const deleteMutation = useDeleteAppointment()

  return {
    appointments,
    loading,

    getAppointment: (id: string) => appointments.find((a) => a.id === id),

    getAppointmentsByCustomerId: (customerId: string) =>
      appointments
        .filter((a) => a.customerId === customerId)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),

    getAppointmentsByProjectId: (projectId: string) =>
      appointments
        .filter((a) => a.projectId === projectId)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),

    createAppointment: async (data: CreateAppointmentData) => {
      const result = await createMutation.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<Appointment[]>(appointmentKeys.all)
      return updated?.find((a) => a.id === (result as any).data?.id)
    },

    updateAppointment: (id: string, data: Partial<CreateAppointmentData>) =>
      updateMutation.mutateAsync({ id, data }).then(() => {}),

    deleteAppointment: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),

    refresh: () =>
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }).then(() => {}),
  }
}