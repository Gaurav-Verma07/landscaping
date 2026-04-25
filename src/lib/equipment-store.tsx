"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { EquipmentAsset, EquipmentBooking, EquipmentStatus, BookingStatus } from "@/lib/equipment-types"

const ASSETS_KEY = "landscaping-v2-equipment-assets"
const BOOKINGS_KEY = "landscaping-v2-equipment-bookings"

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === "") return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, data: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function createId() {
  return `eq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = new Date(aStart).getTime()
  const aE = new Date(aEnd).getTime()
  const bS = new Date(bStart).getTime()
  const bE = new Date(bEnd).getTime()
  return aS < bE && aE > bS
}

type EquipmentStoreValue = {
  assets: EquipmentAsset[]
  bookings: EquipmentBooking[]
  createAsset: (data: Omit<EquipmentAsset, "id" | "createdAt" | "updatedAt">) => EquipmentAsset
  updateAsset: (id: string, data: Partial<Omit<EquipmentAsset, "id" | "createdAt" | "updatedAt">>) => void
  deleteAsset: (id: string) => void
  createBooking: (data: Omit<EquipmentBooking, "id" | "createdAt" | "updatedAt">) => EquipmentBooking
  updateBooking: (id: string, data: Partial<Omit<EquipmentBooking, "id" | "createdAt" | "updatedAt">>) => void
  deleteBooking: (id: string) => void
  getBookingsByAssetId: (assetId: string) => EquipmentBooking[]
  getBookingsByProjectId: (projectId: string) => EquipmentBooking[]
  getConflictingBookings: (assetId: string, startAt: string, endAt: string, excludeBookingId?: string) => EquipmentBooking[]
}

const EquipmentStoreContext = createContext<EquipmentStoreValue | null>(null)

export function EquipmentStoreProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<EquipmentAsset[]>([])
  const [bookings, setBookings] = useState<EquipmentBooking[]>([])

  useEffect(() => {
    setAssets(loadJson<EquipmentAsset[]>(ASSETS_KEY, []))
    setBookings(loadJson<EquipmentBooking[]>(BOOKINGS_KEY, []))
  }, [])

  const persistAssets = useCallback((list: EquipmentAsset[]) => {
    setAssets(list)
    saveJson(ASSETS_KEY, list)
  }, [])

  const persistBookings = useCallback((list: EquipmentBooking[]) => {
    setBookings(list)
    saveJson(BOOKINGS_KEY, list)
  }, [])

  const createAsset = useCallback(
    (data: Omit<EquipmentAsset, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const asset: EquipmentAsset = { ...data, id: createId(), createdAt: now, updatedAt: now }
      persistAssets([...assets, asset])
      return asset
    },
    [assets, persistAssets],
  )

  const updateAsset = useCallback(
    (id: string, data: Partial<Omit<EquipmentAsset, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      persistAssets(assets.map((a) => (a.id === id ? { ...a, ...data, updatedAt: now } : a)))
    },
    [assets, persistAssets],
  )

  const deleteAsset = useCallback(
    (id: string) => {
      persistAssets(assets.filter((a) => a.id !== id))
      persistBookings(bookings.filter((b) => b.assetId !== id))
    },
    [assets, bookings, persistAssets, persistBookings],
  )

  const createBooking = useCallback(
    (data: Omit<EquipmentBooking, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const booking: EquipmentBooking = { ...data, id: createId(), createdAt: now, updatedAt: now }
      persistBookings([...bookings, booking])
      return booking
    },
    [bookings, persistBookings],
  )

  const updateBooking = useCallback(
    (id: string, data: Partial<Omit<EquipmentBooking, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      persistBookings(bookings.map((b) => (b.id === id ? { ...b, ...data, updatedAt: now } : b)))
    },
    [bookings, persistBookings],
  )

  const deleteBooking = useCallback(
    (id: string) => persistBookings(bookings.filter((b) => b.id !== id)),
    [bookings, persistBookings],
  )

  const getBookingsByAssetId = useCallback(
    (assetId: string) =>
      bookings.filter((b) => b.assetId === assetId && b.status !== "cancelled").sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [bookings],
  )

  const getBookingsByProjectId = useCallback(
    (projectId: string) =>
      bookings.filter((b) => b.projectId === projectId && b.status !== "cancelled").sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [bookings],
  )

  const getConflictingBookings = useCallback(
    (assetId: string, startAt: string, endAt: string, excludeBookingId?: string) => {
      return bookings.filter((b) => {
        if (b.assetId !== assetId || b.status === "cancelled") return false
        if (excludeBookingId && b.id === excludeBookingId) return false
        return rangesOverlap(b.startAt, b.endAt, startAt, endAt)
      })
    },
    [bookings],
  )

  const value: EquipmentStoreValue = {
    assets,
    bookings,
    createAsset,
    updateAsset,
    deleteAsset,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingsByAssetId,
    getBookingsByProjectId,
    getConflictingBookings,
  }

  return (
    <EquipmentStoreContext.Provider value={value}>
      {children}
    </EquipmentStoreContext.Provider>
  )
}

export function useEquipmentStore(): EquipmentStoreValue {
  const ctx = useContext(EquipmentStoreContext)
  if (!ctx) throw new Error("useEquipmentStore must be used within EquipmentStoreProvider")
  return ctx
}
