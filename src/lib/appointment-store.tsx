'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Appointment, CreateAppointmentData } from '@/lib/appointment-types'
import {
  getAppointments,
  getAppointmentsByCustomerId as getByCustomerIdAction,
  getAppointmentsByProjectId as getByProjectIdAction,
  createAppointment as createAction,
  updateAppointment as updateAction,
  deleteAppointment as deleteAction,
} from '@/lib/actions/appointments'

type AppointmentStoreValue = {
  appointments: Appointment[]
  loading: boolean
  getAppointment: (id: string) => Appointment | undefined
  getAppointmentsByCustomerId: (customerId: string) => Appointment[]
  getAppointmentsByProjectId: (projectId: string) => Appointment[]
  createAppointment: (data: CreateAppointmentData) => Promise<Appointment | undefined>
  updateAppointment: (id: string, data: Partial<CreateAppointmentData>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const AppointmentStoreContext = createContext<AppointmentStoreValue | null>(null)

export function AppointmentStoreProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getAppointments()
    setAppointments(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const getAppointment = useCallback(
    (id: string) => appointments.find((a) => a.id === id),
    [appointments]
  )

  const getAppointmentsByCustomerId = useCallback(
    (customerId: string) =>
      appointments
        .filter((a) => a.customerId === customerId)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [appointments]
  )

  const getAppointmentsByProjectId = useCallback(
    (projectId: string) =>
      appointments
        .filter((a) => a.projectId === projectId)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [appointments]
  )

  const createAppointment = useCallback(async (data: CreateAppointmentData) => {
    const result = await createAction(data)
    if ('error' in result) return undefined
    await refresh()
    return appointments.find((a) => a.id === result.data?.id)
  }, [appointments, refresh])

  const updateAppointment = useCallback(async (id: string, data: Partial<CreateAppointmentData>) => {
    await updateAction(id, data)
    await refresh()
  }, [refresh])

  const deleteAppointment = useCallback(async (id: string) => {
    await deleteAction(id)
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const value: AppointmentStoreValue = {
    appointments, loading,
    getAppointment, getAppointmentsByCustomerId, getAppointmentsByProjectId,
    createAppointment, updateAppointment, deleteAppointment, refresh,
  }

  return (
    <AppointmentStoreContext.Provider value={value}>
      {children}
    </AppointmentStoreContext.Provider>
  )
}

export function useAppointmentStore(): AppointmentStoreValue {
  const ctx = useContext(AppointmentStoreContext)
  if (!ctx) throw new Error('useAppointmentStore must be used within AppointmentStoreProvider')
  return ctx
}