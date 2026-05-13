'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAssets, getBookings,
  createAsset as createAssetAction, updateAsset as updateAssetAction, deleteAsset as deleteAssetAction,
  createBooking as createBookingAction, updateBooking as updateBookingAction, deleteBooking as deleteBookingAction,
  getConflictingBookings as getConflictingBookingsAction,
} from '@/lib/actions/equipment'
import type { EquipmentAsset, EquipmentBooking } from '@/types/equipment-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const equipmentKeys = {
  assets: ['equipment-assets'] as const,
  bookings: ['equipment-bookings'] as const,
}

export function useAssets() {
  return useQuery({ queryKey: equipmentKeys.assets, queryFn: getAssets })
}

export function useBookings() {
  return useQuery({ queryKey: equipmentKeys.bookings, queryFn: getBookings })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (data: Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => createAssetAction(data),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.assets })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'equipment_asset_created', entityType: 'equipment', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateAssetAction(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.assets })
      void logAudit.mutateAsync({ action: 'equipment_asset_updated', entityType: 'equipment', entityId: variables.id })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteAssetAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: equipmentKeys.assets })
      const previous = queryClient.getQueryData<EquipmentAsset[]>(equipmentKeys.assets)
      queryClient.setQueryData<EquipmentAsset[]>(equipmentKeys.assets, (old) =>
        old?.filter((a) => a.id !== id) ?? []
      )
      queryClient.setQueryData<EquipmentBooking[]>(equipmentKeys.bookings, (old) =>
        old?.filter((b) => b.assetId !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(equipmentKeys.assets, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.assets })
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.bookings })
      void logAudit.mutateAsync({ action: 'equipment_asset_deleted', entityType: 'equipment', entityId: id })
    },
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (data: Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>) => createBookingAction(data),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.bookings })
      const id = (result as any)?.data?.id ?? variables.assetId
      void logAudit.mutateAsync({ action: 'equipment_booking_created', entityType: 'booking', entityId: id, details: `Asset: ${variables.assetId}` })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateBookingAction(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.bookings })
      void logAudit.mutateAsync({ action: 'equipment_booking_updated', entityType: 'booking', entityId: variables.id })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteBookingAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: equipmentKeys.bookings })
      const previous = queryClient.getQueryData<EquipmentBooking[]>(equipmentKeys.bookings)
      queryClient.setQueryData<EquipmentBooking[]>(equipmentKeys.bookings, (old) =>
        old?.filter((b) => b.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(equipmentKeys.bookings, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.bookings })
      void logAudit.mutateAsync({ action: 'equipment_booking_deleted', entityType: 'booking', entityId: id })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useEquipmentStore() {
  const queryClient = useQueryClient()
  const { data: assets = [], isLoading: assetsLoading } = useAssets()
  const { data: bookings = [] } = useBookings()

  const createAssetMut = useCreateAsset()
  const updateAssetMut = useUpdateAsset()
  const deleteAssetMut = useDeleteAsset()
  const createBookingMut = useCreateBooking()
  const updateBookingMut = useUpdateBooking()
  const deleteBookingMut = useDeleteBooking()

  return {
    assets,
    bookings,
    loading: assetsLoading,

    createAsset: async (data: Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createAssetMut.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<EquipmentAsset[]>(equipmentKeys.assets)
      return updated?.find((a) => a.id === (result as any).data?.id)
    },

    updateAsset: (id: string, data: Partial<Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateAssetMut.mutateAsync({ id, data }).then(() => {}),

    deleteAsset: (id: string) => deleteAssetMut.mutateAsync(id).then(() => {}),

    createBooking: async (data: Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createBookingMut.mutateAsync(data)
      if ('error' in result) return undefined
      return (result as any).data as EquipmentBooking | undefined
    },

    updateBooking: (id: string, data: Partial<Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateBookingMut.mutateAsync({ id, data }).then(() => {}),

    deleteBooking: (id: string) => deleteBookingMut.mutateAsync(id).then(() => {}),

    getBookingsByAssetId: (assetId: string) =>
      bookings
        .filter((b) => b.assetId === assetId && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),

    getBookingsByProjectId: (projectId: string) =>
      bookings
        .filter((b) => b.projectId === projectId && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),

    getConflictingBookings: (assetId: string, startAt: string, endAt: string, excludeBookingId?: string) =>
      getConflictingBookingsAction(assetId, startAt, endAt, excludeBookingId),

    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: equipmentKeys.assets }),
        queryClient.invalidateQueries({ queryKey: equipmentKeys.bookings }),
      ]).then(() => {}),
  }
}