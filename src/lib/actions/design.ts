'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  LandscapeDesign,
  DesignZone,
  DesignPlant,
  PlantCatalogItem,
  DesignMaterialsList,
  DesignMaterialLineItem,
  CreateDesignInput,
  UpdateDesignInput,
  CreateZoneInput,
  UpdateZoneInput,
  CreatePlantInput,
  UpdatePlantInput,
  CreatePlantCatalogInput,
  CanvasState,
} from '@/types/design-types'
import { ZONE_TYPE_LABELS } from '@/enums/design-enums'

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// ─── Default canvas state ──────────────────────────────────────────────────

function defaultCanvasState(): CanvasState {
  return {
    backgroundImageUrl: null,
    fabricJson: null,
    labels: [],
    measurements: [],
    pixelsPerFoot: 10,
    panX: 0,
    panY: 0,
    zoom: 1,
    layers: {
      background: true,
      zones: true,
      plants: true,
      labels: true,
      measurements: true,
    },
  }
}

// ============================================
// LANDSCAPE DESIGNS
// ============================================

export async function getDesigns(): Promise<LandscapeDesign[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('landscape_designs')
    .select('*, design_zones(*), design_plants(*)')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  return (data ?? []).map(mapDesign)
}

export async function getDesign(id: string): Promise<LandscapeDesign | null> {
  const { supabase } = await getUser()

  const { data } = await supabase
    .from('landscape_designs')
    .select('*, design_zones(*), design_plants(*)')
    .eq('id', id)
    .single()

  return data ? mapDesign(data) : null
}

export async function getDesignsByCustomerId(customerId: string): Promise<LandscapeDesign[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('landscape_designs')
    .select('*, design_zones(*), design_plants(*)')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })

  return (data ?? []).map(mapDesign)
}

export async function getDesignsByProjectId(projectId: string): Promise<LandscapeDesign[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('landscape_designs')
    .select('*, design_zones(*), design_plants(*)')
    .eq('profile_id', user.id)
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })

  return (data ?? []).map(mapDesign)
}

export async function createDesign(input: CreateDesignInput) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('landscape_designs')
    .insert({
      profile_id: user.id,
      customer_id: input.customerId,
      project_id: input.projectId ?? null,
      name: input.name,
      status: 'draft',
      canvas_state: defaultCanvasState(),
      total_area_sqft: 0,
      thumbnail_url: null,
      notes: input.notes ?? '',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/design')
  return { data }
}

export async function updateDesign(id: string, patch: UpdateDesignInput) {
  const { supabase } = await getUser()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('landscape_designs')
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.projectId !== undefined && { project_id: patch.projectId }),
      ...(patch.canvasState !== undefined && { canvas_state: patch.canvasState }),
      ...(patch.totalAreaSqft !== undefined && { total_area_sqft: patch.totalAreaSqft }),
      ...(patch.thumbnailUrl !== undefined && { thumbnail_url: patch.thumbnailUrl }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      updated_at: now,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/design')
  return { success: true }
}

export async function deleteDesign(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('landscape_designs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/design')
  return { success: true }
}

// ============================================
// ZONES
// ============================================

export async function upsertZone(input: CreateZoneInput & { id?: string }) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const row = {
    design_id: input.designId,
    name: input.name,
    zone_type: input.zoneType,
    fill_material: input.fillMaterial,
    area_sqft: input.areaSqft,
    polygon_points: input.polygonPoints,
    color_override: input.colorOverride ?? null,
    notes: input.notes,
  }

  if (input.id) {
    const { error } = await supabase
      .from('design_zones')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', input.id)
    if (error) return { error: error.message }
    return { success: true }
  }

  const { data, error } = await supabase.from('design_zones').insert(row).select().single()
  if (error) return { error: error.message }
  return { data }
}

export async function deleteZone(id: string) {
  const { supabase } = await getUser()
  // Also remove plants in this zone
  await supabase.from('design_plants').update({ zone_id: null }).eq('zone_id', id)
  const { error } = await supabase.from('design_zones').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================
// PLANTS (placements)
// ============================================

export async function upsertPlant(input: CreatePlantInput & { id?: string }) {
  const { supabase } = await getUser()

  const row = {
    design_id: input.designId,
    zone_id: input.zoneId ?? null,
    plant_catalog_id: input.plantCatalogId,
    x: input.x,
    y: input.y,
    quantity: input.quantity,
    spacing_ft: input.spacingFt,
    rotation: input.rotation,
    scale_multiplier: input.scaleMultiplier,
    common_name: input.commonName,
    plant_type: input.plantType,
  }

  if (input.id) {
    const { error } = await supabase.from('design_plants').update(row).eq('id', input.id)
    if (error) return { error: error.message }
    return { success: true }
  }

  const { data, error } = await supabase.from('design_plants').insert(row).select().single()
  if (error) return { error: error.message }
  return { data }
}

export async function deletePlant(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('design_plants').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================
// PLANT CATALOG
// ============================================

export async function getPlantCatalog(): Promise<PlantCatalogItem[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('plant_catalog')
    .select('*')
    .or(`org_id.is.null,profile_id.eq.${user.id}`)
    .order('common_name')

  return (data ?? []).map(mapPlant)
}

export async function createPlantCatalogItem(input: CreatePlantCatalogInput) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('plant_catalog')
    .insert({
      profile_id: user.id,
      org_id: user.id, // org-scoped custom plant
      common_name: input.commonName,
      botanical_name: input.botanicalName,
      plant_type: input.plantType,
      sun_requirement: input.sunRequirement,
      water_need: input.waterNeed,
      mature_height_ft: input.matureHeightFt,
      mature_spread_ft: input.matureSpreadFt,
      hardiness_zones: input.hardinessZones,
      icon_url: input.iconUrl ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/design')
  return { data }
}

export async function updatePlantCatalogItem(
  id: string,
  patch: Partial<Omit<PlantCatalogItem, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('plant_catalog')
    .update({
      ...(patch.commonName !== undefined && { common_name: patch.commonName }),
      ...(patch.botanicalName !== undefined && { botanical_name: patch.botanicalName }),
      ...(patch.plantType !== undefined && { plant_type: patch.plantType }),
      ...(patch.sunRequirement !== undefined && { sun_requirement: patch.sunRequirement }),
      ...(patch.waterNeed !== undefined && { water_need: patch.waterNeed }),
      ...(patch.matureHeightFt !== undefined && { mature_height_ft: patch.matureHeightFt }),
      ...(patch.matureSpreadFt !== undefined && { mature_spread_ft: patch.matureSpreadFt }),
      ...(patch.hardinessZones !== undefined && { hardiness_zones: patch.hardinessZones }),
      ...(patch.iconUrl !== undefined && { icon_url: patch.iconUrl }),
      ...(patch.thumbnailUrl !== undefined && { thumbnail_url: patch.thumbnailUrl }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deletePlantCatalogItem(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('plant_catalog').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Upload a plant icon or thumbnail to the design-assets bucket,
 * then persist the public URL back to plant_catalog.
 *
 * assetType 'icon'      → design-assets/plant-icons/{id}.{ext}       → icon_url
 * assetType 'thumbnail' → design-assets/plant-thumbnails/{id}.{ext}  → thumbnail_url
 */
export async function uploadPlantAsset(
  plantId: string,
  formData: FormData,
  assetType: 'icon' | 'thumbnail'
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const folder = assetType === 'icon' ? 'plant-icons' : 'plant-thumbnails'
  const path = `${folder}/${plantId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('design-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('design-assets').getPublicUrl(path)

  const patch =
    assetType === 'icon'
      ? { iconUrl: publicUrl }
      : { thumbnailUrl: publicUrl }

  // First check if this plant belongs to the current user — global/seeded plants
  // have profile_id = null and cannot be updated by RLS policy.
  const { data: existingPlant } = await supabase
    .from('plant_catalog')
    .select('profile_id')
    .eq('id', plantId)
    .single()

  if (!existingPlant?.profile_id) {
    // Global/seeded plant — RLS won't allow update. Clean up the uploaded file.
    await supabase.storage.from('design-assets').remove([path])
    return { error: 'Cannot upload icons for built-in plants. Add this plant to your library first.' }
  }

  const { error: dbError } = await supabase
    .from('plant_catalog')
    .update({
      ...(assetType === 'icon' ? { icon_url: publicUrl } : { thumbnail_url: publicUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('profile_id', user.id)

  if (dbError) return { error: dbError.message }

  void patch // suppress unused var lint
  revalidatePath('/dashboard/design')
  return { url: publicUrl }
}

// ============================================
// MATERIALS LIST COMPUTATION
// (server-side, no AI — pure math from zones/plants)
// ============================================

export async function computeMaterialsList(designId: string): Promise<DesignMaterialsList> {
  const { supabase, user } = await getUser()
  if (!user) return emptyMaterialsList()

  // Fetch zones
  const { data: zones } = await supabase
    .from('design_zones')
    .select('*')
    .eq('design_id', designId)

  // Fetch plants with their counts
  const { data: plants } = await supabase
    .from('design_plants')
    .select('*')
    .eq('design_id', designId)

  // Fetch material catalog for price lookup
  const { data: materials } = await supabase
    .from('material_catalog')
    .select('*')
    .eq('profile_id', user.id)

  const matMap = new Map<string, { id: string; defaultPrice: number; unit: string }>(
    (materials ?? []).map((m: Record<string, unknown>) => [
      (m.name as string).toLowerCase(),
      { id: m.id as string, defaultPrice: m.default_price as number, unit: m.unit as string },
    ])
  )

  const items: DesignMaterialLineItem[] = []
  let totalAreaSqft = 0

  // Zone-based materials
  for (const zone of zones ?? []) {
    const areaSqft = zone.area_sqft as number
    totalAreaSqft += areaSqft
    const fillMaterial = (zone.fill_material as string) || ZONE_TYPE_LABELS[zone.zone_type as keyof typeof ZONE_TYPE_LABELS]
    const matKey = fillMaterial.toLowerCase()
    const mat = matMap.get(matKey)

    if (!fillMaterial) continue

    // Convert sqft to appropriate unit based on material
    let qty = areaSqft
    let unit = 'sqft'
    let desc = fillMaterial

    // Mulch / wood chips: ~1 cu yd per 100 sqft at 3" depth
    if (['mulch', 'wood chips', 'bark'].some((k) => matKey.includes(k))) {
      qty = Math.ceil(areaSqft / 100)
      unit = 'cu yd'
      desc = fillMaterial
    }
    // Gravel: ~1 ton per 80 sqft at 2" depth
    else if (['gravel', 'stone', 'rock', 'pea gravel'].some((k) => matKey.includes(k))) {
      qty = Math.ceil(areaSqft / 80)
      unit = 'ton'
      desc = fillMaterial
    }
    // Sod / lawn
    else if (['sod', 'lawn', 'turf'].some((k) => matKey.includes(k) || zone.zone_type === 'lawn')) {
      qty = areaSqft
      unit = 'sqft'
      desc = 'Sod / Turf'
    }
    // Hardscape: pavers etc.
    else if (zone.zone_type === 'hardscape') {
      qty = areaSqft
      unit = 'sqft'
    }

    items.push({
      description: desc,
      quantity: Math.max(1, Math.round(qty * 10) / 10),
      unit: mat?.unit ?? unit,
      estimatedUnitPrice: mat?.defaultPrice ?? 0,
      estimatedTotal: mat ? Math.round(qty * mat.defaultPrice * 100) / 100 : 0,
      materialCatalogId: mat?.id ?? null,
      source: 'zone_fill',
    })
  }

  // Plant-based items — group by species
  const plantGroups = new Map<string, { name: string; total: number }>()
  for (const p of plants ?? []) {
    const key = p.plant_catalog_id as string
    const existing = plantGroups.get(key)
    if (existing) {
      existing.total += p.quantity as number
    } else {
      plantGroups.set(key, { name: p.common_name as string, total: p.quantity as number })
    }
  }

  for (const [, group] of plantGroups) {
    const matKey = group.name.toLowerCase()
    const mat = matMap.get(matKey)
    items.push({
      description: group.name,
      quantity: group.total,
      unit: 'each',
      estimatedUnitPrice: mat?.defaultPrice ?? 0,
      estimatedTotal: mat ? group.total * mat.defaultPrice : 0,
      materialCatalogId: mat?.id ?? null,
      source: 'plant_spacing',
    })
  }

  return {
    items,
    totalAreaSqft,
    totalPlants: (plants ?? []).reduce((s, p) => s + (p.quantity as number), 0),
    generatedAt: new Date().toISOString(),
    notes: '',
  }
}

function emptyMaterialsList(): DesignMaterialsList {
  return {
    items: [],
    totalAreaSqft: 0,
    totalPlants: 0,
    generatedAt: new Date().toISOString(),
    notes: '',
  }
}

// ============================================
// QUOTE INTEGRATION
// Push design materials list → create quote
// ============================================

export async function designToQuoteDraft(designId: string) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const design = await getDesign(designId)
  if (!design) return { error: 'Design not found' }

  const materialsList = await computeMaterialsList(designId)

  // Build quote line items
  let sortOrder = 0
  const lineItems = materialsList.items.map((item) => ({
    id: crypto.randomUUID(),
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.estimatedUnitPrice,
    discountPercent: 0,
    amount: item.estimatedTotal,
    sortOrder: sortOrder++,
  }))

  // Fetch next quote number
  const { data: existing } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('profile_id', user.id)

  const nums = (existing ?? [])
    .map((q: Record<string, unknown>) => String(q.quote_number).replace(/^\D+/, ''))
    .filter(Boolean)
    .map(Number)
    .filter((n) => !isNaN(n))
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1
  const quoteNumber = `Q-${String(next).padStart(3, '0')}`

  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0)
  const taxRatePercent = 0
  const taxAmount = 0

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      profile_id: user.id,
      customer_id: design.customerId,
      project_id: design.projectId ?? null,
      quote_number: quoteNumber,
      status: 'draft',
      subtotal,
      tax_rate_percent: taxRatePercent,
      tax_amount: taxAmount,
      total: subtotal + taxAmount,
      valid_until: null,
      notes: `Auto-generated from landscape design: ${design.name}`,
      template_id: null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (lineItems.length > 0) {
    await supabase.from('quote_line_items').insert(
      lineItems.map((l) => ({
        quote_id: quote.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unitPrice,
        discount_percent: 0,
        amount: l.amount,
        sort_order: l.sortOrder,
      }))
    )
  }

  revalidatePath('/dashboard/quotes')
  return { data: quote, quoteNumber }
}

// ============================================
// MAPPERS
// ============================================

function mapDesign(row: Record<string, unknown>): LandscapeDesign {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    projectId: (row.project_id as string) ?? null,
    name: row.name as string,
    status: row.status as LandscapeDesign['status'],
    canvasState: (row.canvas_state as CanvasState) ?? defaultCanvasState(),
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    totalAreaSqft: (row.total_area_sqft as number) ?? 0,
    zones: ((row.design_zones as Record<string, unknown>[]) ?? []).map(mapZone),
    plants: ((row.design_plants as Record<string, unknown>[]) ?? []).map(mapDesignPlant),
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapZone(row: Record<string, unknown>): DesignZone {
  return {
    id: row.id as string,
    designId: row.design_id as string,
    name: row.name as string,
    zoneType: row.zone_type as DesignZone['zoneType'],
    fillMaterial: (row.fill_material as string) ?? '',
    areaSqft: (row.area_sqft as number) ?? 0,
    polygonPoints: (row.polygon_points as DesignZone['polygonPoints']) ?? [],
    colorOverride: (row.color_override as string) ?? null,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapDesignPlant(row: Record<string, unknown>): DesignPlant {
  return {
    id: row.id as string,
    designId: row.design_id as string,
    zoneId: (row.zone_id as string) ?? null,
    plantCatalogId: row.plant_catalog_id as string,
    x: row.x as number,
    y: row.y as number,
    quantity: (row.quantity as number) ?? 1,
    spacingFt: (row.spacing_ft as number) ?? 2,
    rotation: (row.rotation as number) ?? 0,
    scaleMultiplier: (row.scale_multiplier as number) ?? 1,
    commonName: row.common_name as string,
    plantType: row.plant_type as DesignPlant['plantType'],
    createdAt: row.created_at as string,
  }
}

function mapPlant(row: Record<string, unknown>): PlantCatalogItem {
  return {
    id: row.id as string,
    orgId: (row.org_id as string) ?? null,
    commonName: row.common_name as string,
    botanicalName: row.botanical_name as string,
    plantType: row.plant_type as PlantCatalogItem['plantType'],
    sunRequirement: row.sun_requirement as PlantCatalogItem['sunRequirement'],
    waterNeed: row.water_need as PlantCatalogItem['waterNeed'],
    matureHeightFt: (row.mature_height_ft as number) ?? 0,
    matureSpreadFt: (row.mature_spread_ft as number) ?? 0,
    hardinessZones: (row.hardiness_zones as string[]) ?? [],
    iconUrl: (row.icon_url as string) ?? null,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}