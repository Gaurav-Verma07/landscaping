// types/design-enums.ts
// Single source of truth for all Design module constants.
// Import from here — never hard-code strings in components.

// ─── Design Status ─────────────────────────────────────────────────────────


export const DESIGN_STATUSES = ['draft', 'shared', 'approved', 'archived'] as const
export type DesignStatus = (typeof DESIGN_STATUSES)[number]

export const DESIGN_STATUS_LABELS: Record<DesignStatus, string> = {
  draft: 'Draft',
  shared: 'Shared with client',
  approved: 'Approved',
  archived: 'Archived',
}

export const DESIGN_STATUS_COLORS: Record<DesignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  shared: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

// ─── Zone Types ────────────────────────────────────────────────────────────

export const ZONE_TYPES = [
  'lawn',
  'planting_bed',
  'hardscape',
  'water',
  'edging',
  'mulch',
  'gravel',
  'other',
] as const
export type ZoneType = (typeof ZONE_TYPES)[number]

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  lawn: 'Lawn',
  planting_bed: 'Planting Bed',
  hardscape: 'Hardscape',
  water: 'Water Feature',
  edging: 'Edging',
  mulch: 'Mulch',
  gravel: 'Gravel',
  other: 'Other',
}

export const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  lawn: '#4ade80',
  planting_bed: '#a3e635',
  hardscape: '#94a3b8',
  water: '#38bdf8',
  edging: '#fb923c',
  mulch: '#92400e',
  gravel: '#9ca3af',
  other: '#c084fc',
}

export const ZONE_TYPE_FILL_OPACITY = 0.35

// ─── Plant Types ───────────────────────────────────────────────────────────

export const PLANT_TYPES = [
  'tree',
  'shrub',
  'perennial',
  'annual',
  'groundcover',
  'grass',
  'vine',
  'succulent',
  'fern',
  'bulb',
] as const
export type PlantType = (typeof PLANT_TYPES)[number]

export const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  tree: 'Tree',
  shrub: 'Shrub',
  perennial: 'Perennial',
  annual: 'Annual',
  groundcover: 'Groundcover',
  grass: 'Ornamental Grass',
  vine: 'Vine / Climber',
  succulent: 'Succulent',
  fern: 'Fern',
  bulb: 'Bulb',
}

export const PLANT_TYPE_ICON_COLORS: Record<PlantType, string> = {
  tree: '#15803d',
  shrub: '#16a34a',
  perennial: '#65a30d',
  annual: '#f59e0b',
  groundcover: '#86efac',
  grass: '#a3e635',
  vine: '#4ade80',
  succulent: '#6ee7b7',
  fern: '#34d399',
  bulb: '#e879f9',
}

// ─── Sun Requirements ──────────────────────────────────────────────────────

export const SUN_REQUIREMENTS = ['full_sun', 'part_shade', 'full_shade'] as const
export type SunRequirement = (typeof SUN_REQUIREMENTS)[number]

export const SUN_REQUIREMENT_LABELS: Record<SunRequirement, string> = {
  full_sun: 'Full Sun',
  part_shade: 'Part Shade',
  full_shade: 'Full Shade',
}

// ─── Water Needs ───────────────────────────────────────────────────────────

export const WATER_NEEDS = ['low', 'medium', 'high'] as const
export type WaterNeed = (typeof WATER_NEEDS)[number]

export const WATER_NEED_LABELS: Record<WaterNeed, string> = {
  low: 'Low Water',
  medium: 'Medium Water',
  high: 'High Water',
}

// ─── Canvas Tool Modes ────────────────────────────────────────────────────

export const CANVAS_TOOLS = ['select', 'polygon', 'rectangle', 'square', 'circle', 'text', 'measure', 'pan'] as const
export type CanvasTool = (typeof CANVAS_TOOLS)[number]

export const CANVAS_TOOL_LABELS: Record<CanvasTool, string> = {
  select: 'Select',
  polygon: 'Draw Zone',
  rectangle: 'Rectangle',
  square: 'Square',
  circle: 'Circle',
  text: 'Text Label',
  measure: 'Measure / Set Scale',
  pan: 'Pan',
}

// ─── Canvas Layers ────────────────────────────────────────────────────────

export const CANVAS_LAYERS = ['background', 'zones', 'plants', 'labels', 'measurements'] as const
export type CanvasLayer = (typeof CANVAS_LAYERS)[number]

export const CANVAS_LAYER_LABELS: Record<CanvasLayer, string> = {
  background: 'Background Photo',
  zones: 'Zones',
  plants: 'Plants',
  labels: 'Labels',
  measurements: 'Measurements',
}

// ─── Material Units ───────────────────────────────────────────────────────

export const MATERIAL_UNITS = [
  'sqft',
  'cuyd',
  'ton',
  'lb',
  'each',
  'lf',     // linear feet
  'pallet',
  'bag',
  'gallon',
] as const
export type MaterialUnit = (typeof MATERIAL_UNITS)[number]

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  sqft: 'sq ft',
  cuyd: 'cu yd',
  ton: 'ton',
  lb: 'lb',
  each: 'each',
  lf: 'linear ft',
  pallet: 'pallet',
  bag: 'bag',
  gallon: 'gallon',
}

// ─── Default Canvas Settings ──────────────────────────────────────────────

export const CANVAS_DEFAULTS = {
  WIDTH: 1200,
  HEIGHT: 800,
  GRID_SIZE: 20,           // px
  DEFAULT_SCALE_PPF: 10,   // pixels per foot (default: 1ft = 10px, so 100ft = 1000px)
  MIN_ZOOM: 0.2,
  MAX_ZOOM: 5,
  AUTOSAVE_DELAY_MS: 2000,
  UNDO_STACK_LIMIT: 60,
  EXPORT_DPI: 150,
} as const

// ─── Hardiness Zones ──────────────────────────────────────────────────────

export const HARDINESS_ZONES = [
  '1a','1b','2a','2b','3a','3b','4a','4b',
  '5a','5b','6a','6b','7a','7b','8a','8b',
  '9a','9b','10a','10b','11a','11b',
] as const
export type HardinessZone = (typeof HARDINESS_ZONES)[number]

// ─── Query Keys ───────────────────────────────────────────────────────────

export const DESIGN_QUERY_KEYS = {
  designs: ['designs'] as const,
  design: (id: string) => ['designs', id] as const,
  plantCatalog: ['plant-catalog'] as const,
} as const