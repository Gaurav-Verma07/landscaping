"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Appointment, CreateAppointmentData } from "@/lib/appointment-types"
import { APPOINTMENT_SEED } from "@/lib/appointment-seed"

const STORAGE_KEY = "landscaping-v2-appointments"

function loadFromStorage(): Appointment[] {
  if (typeof window === "undefined") return [...APPOINTMENT_SEED]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return [...APPOINTMENT_SEED]
    const parsed = JSON.parse(raw) as Appointment[]
    return Array.isArray(parsed) ? parsed : [...APPOINTMENT_SEED]
  } catch {
    return [...APPOINTMENT_SEED]
  }
}

function saveToStorage(list: Appointment[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function createId() {
  return `apt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type AppointmentStoreValue = {
  appointments: Appointment[]
  getAppointment: (id: string) => Appointment | undefined
  getAppointmentsByCustomerId: (customerId: string) => Appointment[]
  getAppointmentsByProjectId: (projectId: string) => Appointment[]
  createAppointment: (data: CreateAppointmentData) => Appointment
  updateAppointment: (id: string, data: Partial<CreateAppointmentData>) => void
  deleteAppointment: (id: string) => void
}

const AppointmentStoreContext = createContext<AppointmentStoreValue | null>(null)

export function AppointmentStoreProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    setAppointments(loadFromStorage())
  }, [])

  const persist = useCallback((list: Appointment[]) => {
    setAppointments(list)
    saveToStorage(list)
  }, [])

  const getAppointment = useCallback(
    (id: string) => appointments.find((a) => a.id === id),
    [appointments],
  )

  const getAppointmentsByCustomerId = useCallback(
    (customerId: string) =>
      appointments.filter((a) => a.customerId === customerId).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [appointments],
  )

  const getAppointmentsByProjectId = useCallback(
    (projectId: string) =>
      appointments.filter((a) => a.projectId === projectId).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [appointments],
  )

  const createAppointment = useCallback(
    (data: CreateAppointmentData) => {
      const now = new Date().toISOString()
      const appointment: Appointment = {
        ...data,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      }
      persist([...appointments, appointment])
      return appointment
    },
    [appointments, persist],
  )

  const updateAppointment = useCallback(
    (id: string, data: Partial<CreateAppointmentData>) => {
      const now = new Date().toISOString()
      persist(
        appointments.map((a) =>
          a.id === id ? { ...a, ...data, updatedAt: now } : a,
        ),
      )
    },
    [appointments, persist],
  )

  const deleteAppointment = useCallback(
    (id: string) => persist(appointments.filter((a) => a.id !== id)),
    [appointments, persist],
  )

  const value: AppointmentStoreValue = {
    appointments,
    getAppointment,
    getAppointmentsByCustomerId,
    getAppointmentsByProjectId,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  }

  return (
    <AppointmentStoreContext.Provider value={value}>
      {children}
    </AppointmentStoreContext.Provider>
  )
}

export function useAppointmentStore(): AppointmentStoreValue {
  const ctx = useContext(AppointmentStoreContext)
  if (!ctx) throw new Error("useAppointmentStore must be used within AppointmentStoreProvider")
  return ctx
}
