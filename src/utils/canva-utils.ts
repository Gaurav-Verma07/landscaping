import type { ZonePoint } from '@/types/design-types'

// ─── Geometry ─────────────────────────────────────────────────────────────

/** Shoelace formula — returns area in px² */
export function polygonAreaPx(points: ZonePoint[]): number {
  if (points.length < 3) return 0
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area) / 2
}

/** Convert px² to sq ft given pixelsPerFoot */
export function pxAreaToSqFt(areaPx: number, pixelsPerFoot: number): number {
  const areaFt2 = areaPx / (pixelsPerFoot * pixelsPerFoot)
  return Math.round(areaFt2 * 10) / 10
}

/** Distance between two points in px */
export function distancePx(a: ZonePoint, b: ZonePoint): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

/** Convert px distance to feet */
export function pxToFeet(px: number, pixelsPerFoot: number): number {
  return Math.round((px / pixelsPerFoot) * 10) / 10
}

/** Polygon centroid */
export function polygonCentroid(points: ZonePoint[]): ZonePoint {
  if (points.length === 0) return { x: 0, y: 0 }
  const x = points.reduce((s, p) => s + p.x, 0) / points.length
  const y = points.reduce((s, p) => s + p.y, 0) / points.length
  return { x, y }
}

/** Bounding box of a set of points */
export function boundingBox(points: ZonePoint[]): {
  minX: number; minY: number; maxX: number; maxY: number; width: number; height: number
} {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Point in polygon test (ray casting) */
export function pointInPolygon(point: ZonePoint, polygon: ZonePoint[]): boolean {
  let inside = false
  const { x, y } = point
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// ─── Scale Calibration ────────────────────────────────────────────────────

/** Given two clicked points and a real-world distance (ft), return px/ft */
export function calibrateScale(p1: ZonePoint, p2: ZonePoint, realDistanceFt: number): number {
  const pxDist = distancePx(p1, p2)
  if (realDistanceFt <= 0 || pxDist <= 0) return 10 // safe default
  return pxDist / realDistanceFt
}

// ─── Material Quantity Helpers ────────────────────────────────────────────

/** Mulch: 1 cu yd covers 100 sqft at 3" depth */
export function sqftToMulchCuYd(sqft: number, depthInches = 3): number {
  return Math.ceil((sqft * depthInches) / (12 * 27))
}

/** Gravel: 1 ton covers ~80 sqft at 2" depth */
export function sqftToGravelTons(sqft: number): number {
  return Math.ceil(sqft / 80)
}

/** Plants from area + spacing */
export function plantsFromSpacing(areaSqft: number, spacingFt: number): number {
  if (spacingFt <= 0) return 1
  // Triangular planting formula
  return Math.ceil(areaSqft / (spacingFt * spacingFt * 0.866))
}

// ─── Canvas Helpers ───────────────────────────────────────────────────────

/** Snap a value to the nearest grid increment */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/** Generate a short readable zone name */
export function generateZoneName(existingNames: string[], prefix = 'Zone'): string {
  let i = 1
  while (existingNames.includes(`${prefix} ${i}`)) i++
  return `${prefix} ${i}`
}

/** Format area for display */
export function formatArea(sqft: number): string {
  if (sqft >= 1000) return `${(sqft / 1000).toFixed(1)}k sq ft`
  return `${sqft.toFixed(0)} sq ft`
}

/** Format distance for display */
export function formatDistance(ft: number): string {
  if (ft >= 1) return `${ft.toFixed(1)} ft`
  return `${(ft * 12).toFixed(0)} in`
}

// ─── Color Helpers ────────────────────────────────────────────────────────

/** Hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(0,0,0,${alpha})`
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Get contrasting text color (black or white) for a background hex */
export function contrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '#000'
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}