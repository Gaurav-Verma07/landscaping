'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { EquipmentAsset, EquipmentBooking } from '@/lib/equipment-types'
import {
  getAssets, getBookings,
  createAsset as createAssetAction, updateAsset as updateAssetAction, deleteAsset as deleteAssetAction,
  createBooking as createBookingAction, updateBooking as updateBookingAction, deleteBooking as deleteBookingAction,
  getConflictingBookings as getConflictingBookingsAction,
} from '@/lib/actions/equipment'

type EquipmentStoreValue = {
  assets: EquipmentAsset[]
  bookings: EquipmentBooking[]
  loading: boolean
  createAsset: (data: Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EquipmentAsset | undefined>
  updateAsset: (id: string, data: Partial<Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  createBooking: (data: Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EquipmentBooking | undefined>
  updateBooking: (id: string, data: Partial<Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  getBookingsByAssetId: (assetId: string) => EquipmentBooking[]
  getBookingsByProjectId: (projectId: string) => EquipmentBooking[]
  getConflictingBookings: (assetId: string, startAt: string, endAt: string, excludeBookingId?: string) => Promise<EquipmentBooking[]>
  refresh: () => Promise<void>
}

const EquipmentStoreContext = createContext<EquipmentStoreValue | null>(null)

export function EquipmentStoreProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<EquipmentAsset[]>([])
  const [bookings, setBookings] = useState<EquipmentBooking[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [a, b] = await Promise.all([getAssets(), getBookings()])
    setAssets(a)
    setBookings(b)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const createAsset = useCallback(async (data: Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createAssetAction(data)
    if ('error' in result) return undefined
    await refresh()
    return assets.find((a) => a.id === result.data?.id)
  }, [assets, refresh])

  const updateAsset = useCallback(async (id: string, data: Partial<Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateAssetAction(id, data)
    await refresh()
  }, [refresh])

  const deleteAsset = useCallback(async (id: string) => {
    await deleteAssetAction(id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
    setBookings((prev) => prev.filter((b) => b.assetId !== id))
  }, [])

  const createBooking = useCallback(async (data: Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createBookingAction(data)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateBooking = useCallback(async (id: string, data: Partial<Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateBookingAction(id, data)
    await refresh()
  }, [refresh])

  const deleteBooking = useCallback(async (id: string) => {
    await deleteBookingAction(id)
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const getBookingsByAssetId = useCallback(
    (assetId: string) =>
      bookings
        .filter((b) => b.assetId === assetId && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [bookings]
  )

  const getBookingsByProjectId = useCallback(
    (projectId: string) =>
      bookings
        .filter((b) => b.projectId === projectId && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [bookings]
  )

  const getConflictingBookings = useCallback(async (
    assetId: string, startAt: string, endAt: string, excludeBookingId?: string
  ) => {
    return getConflictingBookingsAction(assetId, startAt, endAt, excludeBookingId)
  }, [])

  const value: EquipmentStoreValue = {
    assets, bookings, loading,
    createAsset, updateAsset, deleteAsset,
    createBooking, updateBooking, deleteBooking,
    getBookingsByAssetId, getBookingsByProjectId, getConflictingBookings,
    refresh,
  }

  return <EquipmentStoreContext.Provider value={value}>{children}</EquipmentStoreContext.Provider>
}

export function useEquipmentStore(): EquipmentStoreValue {
  const ctx = useContext(EquipmentStoreContext)
  if (!ctx) throw new Error('useEquipmentStore must be used within EquipmentStoreProvider')
  return ctx
}