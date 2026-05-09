'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDesigns,
  getDesign,
  getDesignsByCustomerId,
  getDesignsByProjectId,
  createDesign as createDesignAction,
  updateDesign as updateDesignAction,
  deleteDesign as deleteDesignAction,
  upsertZone as upsertZoneAction,
  deleteZone as deleteZoneAction,
  upsertPlant as upsertPlantAction,
  deletePlant as deletePlantAction,
  getPlantCatalog,
  createPlantCatalogItem as createPlantAction,
  updatePlantCatalogItem as updatePlantAction,
  deletePlantCatalogItem as deletePlantFromCatalogAction,
  uploadPlantAsset as uploadPlantAssetAction,
  computeMaterialsList,
  designToQuoteDraft,
} from '@/lib/actions/design'
import { DESIGN_QUERY_KEYS } from '@/enums/design-enums'
import type {
  LandscapeDesign,
  PlantCatalogItem,
  CreateDesignInput,
  UpdateDesignInput,
  CreateZoneInput,
  UpdateZoneInput,
  CreatePlantInput,
  CreatePlantCatalogInput,
} from '@/types/design-types'

// ============================================
// QUERIES
// ============================================

export function useDesigns() {
  return useQuery({
    queryKey: DESIGN_QUERY_KEYS.designs,
    queryFn: getDesigns,
  })
}

export function useDesign(id: string | undefined) {
  return useQuery({
    queryKey: DESIGN_QUERY_KEYS.design(id ?? ''),
    queryFn: () => getDesign(id!),
    enabled: !!id,
  })
}

export function useDesignsByCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: [...DESIGN_QUERY_KEYS.designs, 'customer', customerId],
    queryFn: () => getDesignsByCustomerId(customerId!),
    enabled: !!customerId,
  })
}

export function useDesignsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: [...DESIGN_QUERY_KEYS.designs, 'project', projectId],
    queryFn: () => getDesignsByProjectId(projectId!),
    enabled: !!projectId,
  })
}

export function usePlantCatalog() {
  return useQuery({
    queryKey: DESIGN_QUERY_KEYS.plantCatalog,
    queryFn: getPlantCatalog,
    staleTime: 5 * 60 * 1000, // plant catalog is relatively static
  })
}

export function useMaterialsList(designId: string | undefined) {
  return useQuery({
    queryKey: [...DESIGN_QUERY_KEYS.designs, 'materials', designId],
    queryFn: () => computeMaterialsList(designId!),
    enabled: !!designId,
  })
}

// ============================================
// DESIGN MUTATIONS
// ============================================

export function useCreateDesign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDesignInput) => createDesignAction(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.designs })
    },
  })
}

export function useUpdateDesign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateDesignInput }) =>
      updateDesignAction(id, patch),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.designs })
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.design(id) })
    },
  })
}

export function useDeleteDesign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDesignAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: DESIGN_QUERY_KEYS.designs })
      const previous = queryClient.getQueryData<LandscapeDesign[]>(DESIGN_QUERY_KEYS.designs)
      queryClient.setQueryData<LandscapeDesign[]>(DESIGN_QUERY_KEYS.designs, (old) =>
        old ? old.filter((d) => d.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DESIGN_QUERY_KEYS.designs, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.designs })
    },
  })
}

// ============================================
// ZONE MUTATIONS
// ============================================

export function useUpsertZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateZoneInput & { id?: string }) => upsertZoneAction(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.design(input.designId) })
    },
  })
}

export function useDeleteZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zoneId, designId }: { zoneId: string; designId: string }) =>
      deleteZoneAction(zoneId),
    onSuccess: (_data, { designId }) => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.design(designId) })
    },
  })
}

// ============================================
// PLANT PLACEMENT MUTATIONS
// ============================================

export function useUpsertPlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlantInput & { id?: string }) => upsertPlantAction(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.design(input.designId) })
    },
  })
}

export function useDeletePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ plantId, designId }: { plantId: string; designId: string }) =>
      deletePlantAction(plantId),
    onSuccess: (_data, { designId }) => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.design(designId) })
    },
  })
}

// ============================================
// PLANT CATALOG MUTATIONS
// ============================================

export function useCreatePlantCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlantCatalogInput) => createPlantAction(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.plantCatalog })
    },
  })
}

export function useUpdatePlantCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Omit<PlantCatalogItem, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>
    }) => updatePlantAction(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.plantCatalog })
    },
  })
}

export function useDeletePlantCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePlantFromCatalogAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.plantCatalog })
    },
  })
}

export function useUploadPlantAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      plantId,
      file,
      assetType,
    }: {
      plantId: string
      file: File
      assetType: 'icon' | 'thumbnail'
    }) => {
      const fd = new FormData()
      fd.append('file', file)
      return uploadPlantAssetAction(plantId, fd, assetType)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.plantCatalog })
    },
  })
}

// ============================================
// QUOTE INTEGRATION
// ============================================

export function useDesignToQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (designId: string) => designToQuoteDraft(designId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}