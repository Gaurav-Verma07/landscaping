import type { DesignStatus, PlantType, SunRequirement, WaterNeed, ZoneType } from "@/enums/design-enums"

export interface PlantCatalogItem {
    id: string
    orgId: string | null
    commonName: string
    botanicalName: string
    plantType: PlantType
    sunRequirement: SunRequirement
    waterNeed: WaterNeed
    matureHeightFt: number
    matureSpreadFt: number
    hardinessZones: string[]
    iconUrl: string | null
    thumbnailUrl: string | null
    notes: string
    createdAt: string
    updatedAt: string
  }
  
export interface ZonePoint{
    x: number
    y: number
}

export interface DesignZone{
    id: string
    designId: string
    name: string
    zoneType: ZoneType
    fillMaterial: string
    areaSqft: number
    polygonPoints: ZonePoint[]
    colorOverride: string| null
    notes: string
    createdAt: string
    updatedAt: string
}

export interface DesignPlant {
    id: string
    designId: string
    zoneId: string | null
    plantCatalogId: string
    x: number
    y: number
    quantity: number
    spacingFt: number
    rotation: number
    scaleMultiplier: number
    commonName: string
    plantType: PlantType
    createdAt: string
  }

export interface CanvasLabel{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    color: string
    bold: boolean
}

export interface CanvasMeasurement{
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    distanceFt: number
    label: string
}

export interface CanvasState{
    backgroundImageUrl: string| null
    fabricJson: string| null
    labels: CanvasLabel[]
    measurements: CanvasMeasurement[]
    pixelsPerFoot: number
    panX: number
    panY: number
    zoom: number
    layers:{
        background: boolean
        zones: boolean
        plants: boolean
        labels: boolean
        measurements: boolean
    }
}

export interface LandscapeDesign {
    id: string
    customerId: string
    projectId: string | null
    name: string
    status: DesignStatus
    canvasState: CanvasState
    thumbnailUrl: string | null
    totalAreaSqft: number
    zones: DesignZone[]
    plants: DesignPlant[]
    notes: string
    createdAt: string
    updatedAt: string
  }

export interface DesignMaterialLineItem {
    description: string
    quantity: number
    unit: string
    estimatedUnitPrice: number
    estimatedTotal: number
    materialCatalogId: string | null
    source: 'zone_fill' | 'plant_spacing' | 'manual'
  }
  

export interface DesignMaterialsList{
    items: DesignMaterialLineItem[]
    totalAreaSqft: number
    totalPlants: number
    generatedAt: string
    notes: string
}

export type CreateDesignInput = {
    customerId: string
    projectId?: string | null
    name: string
    notes?: string
  }
  
export type UpdateDesignInput= Partial<{
    name: string
    status: DesignStatus
    projectId: string| null
    canvasState: CanvasState
    totalAreaSqft: number
    thumbnailUrl: string| null
    notes: string
}>

export type CreateZoneInput= Omit<DesignZone, 'id'| 'createAt'| 'updatedAt'>
export type UpdateZoneInput= Partial<Omit<DesignZone, 'id'|'designId'|  'createdAt'| 'updatedAt'>>

export type CreatePlantInput= Omit<DesignPlant, 'id'| 'createdAt'>
export type UpdatePlantInput= Partial<Omit<DesignPlant, 'id'| 'designId' | 'createAt'>>

export type CreatePlantCatalogInput= Omit<PlantCatalogItem, 'id'| 'createdAt' | 'updatedAt'>
