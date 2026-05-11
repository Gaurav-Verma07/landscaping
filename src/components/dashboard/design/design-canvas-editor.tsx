/* eslint-disable @typescript-eslint/consistent-type-imports */
'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  Save,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Images,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useDesign, useUpdateDesign, useUpsertZone, useDeleteZone, useUpsertPlant, useDeletePlant } from '@/lib/hooks/use-design'
import { useCustomers } from '@/lib/hooks/use-customers'
import {
  CANVAS_DEFAULTS,
  ZONE_TYPE_COLORS,
  ZONE_TYPE_FILL_OPACITY,
  PLANT_TYPE_ICON_COLORS,
  DESIGN_STATUS_LABELS,
  DESIGN_STATUS_COLORS,
} from '@/enums/design-enums'
import type { CanvasTool, CanvasLayer } from '@/enums/design-enums'
import type { DesignZone, DesignPlant, PlantCatalogItem, ZonePoint, CanvasState } from '@/types/design-types'

import { DesignToolbar } from './design-toolbar'
import { LayersPanel } from './layers-panel'
import { PlantLibraryPanel } from './plant-library-panel'
import { ZonePropertiesPanel } from './zone-properties-panel'
import { ScaleCalibrationDialog } from './scale-calibration-dialog'
import { ExportDialog } from './export-dialog'
import { MaterialsListDialog } from './materials-list-dialog'
import {
  polygonAreaPx,
  pxAreaToSqFt,
  generateZoneName,
  formatArea,
  hexToRgba,
} from '@/utils/utils'

// ─── Fabric v7: augment FabricObject to accept custom `data` property ────────
declare module 'fabric' {
  interface FabricObject {
    data?: Record<string, unknown>
  }
  interface SerializedObjectProps {
    data?: Record<string, unknown>
  }
}

// ─── Fabric.js types (dynamic import) ─────────────────────────────────────
type FabricCanvas = import('fabric').Canvas
type FabricImage = import('fabric').Image

const DESIGN_IMAGES_BUCKET = 'design-images'

// ─── State ────────────────────────────────────────────────────────────────

interface EditorState {
  activeTool: CanvasTool
  gridEnabled: boolean
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  selectedZoneId: string | null
  /** manual save only — no auto-save */
  isSaving: boolean
  isDirty: boolean
  leftPanelTab: 'layers' | 'plants' | 'images'
  rightPanelCollapsed: boolean
  showExport: boolean
  showMaterials: boolean
  showCalibration: boolean
  /** null = waiting first click; set = waiting second click */
  calibrationFirstPoint: ZonePoint | null
  isDrawingPolygon: boolean
  polygonPoints: ZonePoint[]
  fullscreen: boolean
  showUnsavedPrompt: boolean
  pendingNavigation: string | null
  /** uploaded image URLs for this design (stored in supabase bucket) */
  imageLibrary: string[]
  isUploadingImage: boolean
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  designId: string
}

export function DesignCanvasEditor({ designId }: Props) {
  const router = useRouter()
  const { data: design, isLoading } = useDesign(designId)
  const { data: customers = [] } = useCustomers()
  const updateDesign = useUpdateDesign()
  const upsertZone = useUpsertZone()
  const deleteZoneMutation = useDeleteZone()
  const upsertPlant = useUpsertPlant()
  const deletePlantMutation = useDeletePlant()

  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  // Prevents object:added during canvas init from marking the design dirty
  const initCompleteRef = useRef(false)

  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])

  const [state, setState] = useState<EditorState>({
    activeTool: 'select',
    gridEnabled: false,
    canUndo: false,
    canRedo: false,
    hasSelection: false,
    selectedZoneId: null,
    isSaving: false,
    isDirty: false,
    leftPanelTab: 'layers',
    rightPanelCollapsed: false,
    showExport: false,
    showMaterials: false,
    showCalibration: false,
    calibrationFirstPoint: null,
    isDrawingPolygon: false,
    polygonPoints: [],
    fullscreen: false,
    showUnsavedPrompt: false,
    pendingNavigation: null,
    imageLibrary: [],
    isUploadingImage: false,
  })

  const pixelsPerFoot = design?.canvasState.pixelsPerFoot ?? CANVAS_DEFAULTS.DEFAULT_SCALE_PPF

  // Ref to pass calibration points to dialog — declared early so mouse effect can write to it
  const calibrationPointsRef = useRef<[ZonePoint, ZonePoint] | null>(null)
  // Ref mirror of calibrationFirstPoint to avoid stale closure in mouse effect
  const calibrationFirstPointRef = useRef<ZonePoint | null>(null)

  // ─── Ensure supabase bucket exists and load image library ─────────────────

  useEffect(() => {
    if (!design) return
    async function initBucketAndLibrary() {
      const supabase = createClient()
      // Create bucket if missing (safe to call even if it exists)
      const { error: bucketErr } = await supabase.storage.createBucket(DESIGN_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      })
      // error code 409 = already exists — ignore it
      if (bucketErr && !bucketErr.message.includes('already exists') && !bucketErr.message.includes('409')) {
        console.warn('Bucket creation warning:', bucketErr.message)
      }

      // List images for this design
      const prefix = `designs/${design!.id}`
      const { data: files } = await supabase.storage
        .from(DESIGN_IMAGES_BUCKET)
        .list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      if (files && files.length > 0) {
        const urls = files
          .filter((f) => f.name !== '.emptyFolderPlaceholder')
          .map((f) => {
            const { data: { publicUrl } } = supabase.storage
              .from(DESIGN_IMAGES_BUCKET)
              .getPublicUrl(`${prefix}/${f.name}`)
            return publicUrl
          })
        setState((s) => ({ ...s, imageLibrary: urls }))
      }
    }
    void initBucketAndLibrary()
  }, [design?.id])

  // ─── Warn on unsaved changes (browser unload) ──────────────────────────────

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (state.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [state.isDirty])

  // ─── Init Fabric.js ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current || !design) return
    const container = canvasContainerRef.current
    if (!container) return

    let canvas: FabricCanvas

    async function initCanvas() {
      const fabric = await import('fabric')

      // Size canvas to fill its container
      const w = container!.clientWidth || CANVAS_DEFAULTS.WIDTH
      const h = container!.clientHeight || CANVAS_DEFAULTS.HEIGHT

      canvas = new fabric.Canvas(canvasElRef.current!, {
        width: w,
        height: h,
        backgroundColor: '#f8f9f0',
        selection: true,
        preserveObjectStacking: true,
      })

      fabricRef.current = canvas
      initCompleteRef.current = false

      // Restore background image
      const bg = design!.canvasState.backgroundImageUrl
      if (bg) {
        try {
          const img: FabricImage = await fabric.Image.fromURL(bg)
          img.set({ left: 0, top: 0, selectable: true, evented: true, hasBorders: true, hasControls: true, opacity: 1, data: { isBackground: true } })
          img.scaleToWidth(w)
          canvas.add(img)
          canvas.sendObjectToBack(img)
        } catch { /* silent */ }
      }

      // Draw saved zones
      for (const zone of design!.zones) {
        await drawZoneOnCanvas(canvas, zone, design!.canvasState.pixelsPerFoot, design!.canvasState.layers.zones)
      }

      // Draw saved plants
      for (const plant of design!.plants) {
        await drawPlantOnCanvas(canvas, plant, design!.canvasState.layers.plants)
      }

      canvas.renderAll()
      pushUndoSnapshot(canvas)
      // Init complete — object:added after this point marks design dirty
      initCompleteRef.current = true

      // ── Selection events ─────────────────────────────────────────────────

      canvas.on('selection:created', () => {
        const active = canvas.getActiveObject()
        const zoneId = (active as any)?.data?.zoneId ?? null
        setState((s) => ({ ...s, hasSelection: true, selectedZoneId: zoneId }))
      })
      canvas.on('selection:updated', () => {
        const active = canvas.getActiveObject()
        const zoneId = (active as any)?.data?.zoneId ?? null
        setState((s) => ({ ...s, hasSelection: true, selectedZoneId: zoneId }))
      })
      canvas.on('selection:cleared', () => {
        setState((s) => ({ ...s, hasSelection: false, selectedZoneId: null }))
      })

      // Mark dirty on any modification (NO auto-save)
      canvas.on('object:modified', () => {
        pushUndoSnapshot(canvas)
        setState((s) => ({ ...s, isDirty: true }))
      })
      canvas.on('object:added', () => {
        if (initCompleteRef.current) setState((s) => ({ ...s, isDirty: true }))
      })

      // ── Rectangle / Circle / Text instant-draw ───────────────────────────
      // We handle these in mouse:down based on activeTool (see separate effect)

      // ── Resize observer ──────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        if (!canvas || !container) return
        const nw = container.clientWidth
        const nh = container.clientHeight
        canvas.setDimensions({ width: nw, height: nh })
        canvas.renderAll()
      })
      ro.observe(container!)

      // ── Keyboard shortcuts ───────────────────────────────────────────────
      function onKeyDown(e: KeyboardEvent) {
        const tag = (e.target as HTMLElement).tagName.toLowerCase()
        if (['input', 'textarea', 'select'].includes(tag)) return
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo() }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo() }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void handleManualSave() }
        if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
        if (e.key === 'v') setTool('select')
        if (e.key === 'p') setTool('polygon')
        if (e.key === 'r') setTool('rectangle')
        if (e.key === 'q') setTool('square')
        if (e.key === 'c') setTool('circle')
        if (e.key === 't') setTool('text')
        if (e.key === 'm') setTool('measure')
        if (e.key === 'g') toggleGrid()
        if (e.key === ' ') { e.preventDefault(); setTool('pan') }
        if (e.key === 'Escape') {
          if (state.isDrawingPolygon) finishPolygon()
          else setTool('select')
        }
      }

      window.addEventListener('keydown', onKeyDown)

      return () => {
        window.removeEventListener('keydown', onKeyDown)
        ro.disconnect()
        canvas.dispose()
        fabricRef.current = null
      }
    }

    const cleanup = initCanvas()
    return () => { cleanup.then((fn) => fn?.()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.id])

  // ─── Mouse:down handler — polygon, measure, rect, circle, text, square ───

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    let isDrawingShape = false
    let startX = 0, startY = 0
    let activeShape: any = null

    async function onMouseDown(opt: any) {
      const { x, y } = opt.scenePoint

      if (state.activeTool === 'polygon') {
        const newPts = [...state.polygonPoints, { x, y }]
        setState((s) => ({ ...s, polygonPoints: newPts, isDrawingPolygon: true }))
        await drawTempDot(canvas!, x, y)
        return
      }

      if (state.activeTool === 'measure') {
        if (!calibrationFirstPointRef.current) {
          calibrationFirstPointRef.current = { x, y }
          setState((s) => ({ ...s, calibrationFirstPoint: { x, y } }))
        } else {
          // Second click — store both points and open dialog
          calibrationPointsRef.current = [calibrationFirstPointRef.current, { x, y }]
          calibrationFirstPointRef.current = null
          setState((s) => ({ ...s, showCalibration: true, calibrationFirstPoint: null }))
        }
        return
      }

      if (['rectangle', 'square', 'circle'].includes(state.activeTool)) {
        isDrawingShape = true
        startX = x
        startY = y
        const fabric = await import('fabric')
        const commonOpts = {
          left: x, top: y, width: 0, height: 0,
          fill: 'rgba(163,230,53,0.25)',
          stroke: '#a3e635',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          data: { isShape: true },
        }
        if (state.activeTool === 'circle') {
          activeShape = new fabric.Ellipse({ ...commonOpts, rx: 0, ry: 0 })
        } else {
          activeShape = new fabric.Rect(commonOpts)
        }
        canvas.add(activeShape)
        return
      }

      if (state.activeTool === 'text') {
        const fabric = await import('fabric')
        const tb = new fabric.IText('Label', {
          left: x, top: y,
          fontSize: 14,
          fill: '#1a1a1a',
          fontFamily: 'Inter, sans-serif',
          selectable: true,
          data: { isLabel: true },
        })
        canvas.add(tb)
        canvas.setActiveObject(tb)
        tb.enterEditing()
        canvas.renderAll()
        pushUndoSnapshot(canvas)
        setState((s) => ({ ...s, isDirty: true, activeTool: 'select' }))
        return
      }
    }

    async function onMouseMove(opt: any) {
      if (!isDrawingShape || !activeShape) return
      const { x, y } = opt.scenePoint
      const dx = x - startX
      const dy = y - startY

      if (state.activeTool === 'circle') {
        // Ellipse: anchor at start, grow outward
        const rx = Math.abs(dx) / 2
        const ry = Math.abs(dy) / 2
        activeShape.set({
          left: Math.min(x, startX),
          top: Math.min(y, startY),
          rx,
          ry,
          width: rx * 2,
          height: ry * 2,
        })
      } else if (state.activeTool === 'square') {
        // Constrain to equal sides, anchor at drag origin
        const side = Math.max(Math.abs(dx), Math.abs(dy))
        activeShape.set({
          left: dx >= 0 ? startX : startX - side,
          top: dy >= 0 ? startY : startY - side,
          width: side,
          height: side,
        })
      } else {
        // Rectangle: free-form
        activeShape.set({
          left: Math.min(x, startX),
          top: Math.min(y, startY),
          width: Math.abs(dx),
          height: Math.abs(dy),
        })
      }
      canvas.renderAll()
    }

    async function onMouseUp() {
      if (!isDrawingShape || !activeShape) return
      isDrawingShape = false
      // Discard zero-size shapes (accidental click without drag)
      const w = activeShape.width ?? 0
      const h = activeShape.height ?? 0
      const rx = (activeShape as any).rx ?? 0
      if (w < 4 && h < 4 && rx < 4) {
        canvas.remove(activeShape)
        activeShape = null
        canvas.renderAll()
        return
      }

      // Save shape as a zone in DB
      if (design) {
        const shape = activeShape
        const left   = shape.left   ?? 0
        const top    = shape.top    ?? 0
        const width  = shape.width  ?? 0
        const height = shape.height ?? 0
        const isCircle = shape.type === 'ellipse'

        // Approximate polygon points for area calculation
        let pts: { x: number; y: number }[]
        if (isCircle) {
          const rx2 = (shape as any).rx ?? width / 2
          const ry2 = (shape as any).ry ?? height / 2
          const cx = left + rx2
          const cy = top + ry2
          pts = Array.from({ length: 32 }, (_, i) => {
            const angle = (i / 32) * Math.PI * 2
            return { x: cx + rx2 * Math.cos(angle), y: cy + ry2 * Math.sin(angle) }
          })
        } else {
          pts = [
            { x: left,         y: top },
            { x: left + width, y: top },
            { x: left + width, y: top + height },
            { x: left,         y: top + height },
          ]
        }

        const zoneName = generateZoneName(design.zones.map((z) => z.name))
        const defaultZoneType = 'planting_bed'
        const color = ZONE_TYPE_COLORS[defaultZoneType]
        const areaPx = polygonAreaPx(pts)
        const areaSqft = pxAreaToSqFt(areaPx, pixelsPerFoot)

        shape.set({
          fill: hexToRgba(color, ZONE_TYPE_FILL_OPACITY),
          stroke: color,
          strokeWidth: 2,
          selectable: true,
          evented: true,
        })

        const result = await upsertZone.mutateAsync({
          designId: design.id,
          name: zoneName,
          zoneType: defaultZoneType,
          fillMaterial: '',
          areaSqft,
          polygonPoints: pts,
          colorOverride: null,
          notes: '',
          createdAt: new Date().toISOString()
        })

        if (result && 'data' in result && result.data) {
          ;(shape as any).data = { zoneId: result.data.id }
          const newTotal = design.zones.reduce((s, z) => s + z.areaSqft, 0) + areaSqft
          void updateDesign.mutateAsync({ id: design.id, patch: { totalAreaSqft: newTotal } })
          canvas.setActiveObject(shape)
          canvas.renderAll()
          pushUndoSnapshot(canvas)
          setState((s) => ({
            ...s,
            isDirty: true,
            activeTool: 'select',
            hasSelection: true,
            selectedZoneId: result.data.id,
          }))
        }
      } else {
        activeShape.set({ selectable: true, evented: true })
        canvas.setActiveObject(activeShape)
        canvas.renderAll()
        pushUndoSnapshot(canvas)
        setState((s) => ({ ...s, isDirty: true, activeTool: 'select' }))
      }

      activeShape = null
    }

    function onDblClick() {
      if (state.activeTool === 'polygon' && state.polygonPoints.length >= 3) {
        finishPolygon()
      }
    }

    canvas.on('mouse:down', onMouseDown as any)
    canvas.on('mouse:move', onMouseMove as any)
    canvas.on('mouse:up', onMouseUp)
    canvas.on('mouse:dblclick', onDblClick)

    return () => {
      canvas.off('mouse:down', onMouseDown as any)
      canvas.off('mouse:move', onMouseMove as any)
      canvas.off('mouse:up', onMouseUp)
      canvas.off('mouse:dblclick', onDblClick)
    }
    // calibrationFirstPoint removed — now handled via ref to avoid stale closure
  }, [state.activeTool, state.polygonPoints])

  // ─── Tool management ────────────────────────────────────────────────────

  function setTool(tool: CanvasTool) {
    const canvas = fabricRef.current
    if (!canvas) return

    if (tool !== 'polygon' && state.isDrawingPolygon) {
      clearTempDots(canvas)
      setState((s) => ({ ...s, polygonPoints: [], isDrawingPolygon: false }))
    }

    const isDrawingTool = ['rectangle', 'square', 'circle', 'text', 'polygon'].includes(tool)

    if (isDrawingTool) {
      canvas.discardActiveObject()
      canvas.selection = false
      // Lock background while drawing so shapes go above it
      canvas.getObjects().forEach((o) => {
        if ((o as any).data?.isBackground) o.set({ selectable: false, evented: false })
      })
    } else {
      canvas.selection = tool === 'select'
      // Restore bg interactivity based on its own current visibility
      canvas.getObjects().forEach((o) => {
        if ((o as any).data?.isBackground) {
          const visible = o.visible ?? true
          o.set({ selectable: visible, evented: visible })
        }
      })
    }

    canvas.isDrawingMode = false
    canvas.defaultCursor = tool === 'pan' ? 'grab' : isDrawingTool ? 'crosshair' : 'default'
    canvas.hoverCursor  = tool === 'pan' ? 'grab' : isDrawingTool ? 'crosshair' : 'pointer'
    canvas.renderAll()
    setState((s) => ({ ...s, activeTool: tool }))
  }

  // ─── Polygon finish ──────────────────────────────────────────────────────

  async function finishPolygon() {
    if (!design) return
    const canvas = fabricRef.current
    if (!canvas || state.polygonPoints.length < 3) {
      if (canvas) clearTempDots(canvas)
      setState((s) => ({ ...s, polygonPoints: [], isDrawingPolygon: false }))
      return
    }

    const pts = state.polygonPoints
    const fabric = await import('fabric')

    const zoneName = generateZoneName(design.zones.map((z) => z.name))
    const defaultZoneType = 'planting_bed'
    const color = ZONE_TYPE_COLORS[defaultZoneType]

    const polygon = new fabric.Polygon(
      pts.map((p) => ({ x: p.x, y: p.y })),
      {
        fill: hexToRgba(color, ZONE_TYPE_FILL_OPACITY),
        stroke: color,
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
      }
    )

    const areaPx = polygonAreaPx(pts)
    const areaSqft = pxAreaToSqFt(areaPx, pixelsPerFoot)

    const result = await upsertZone.mutateAsync({
      designId: design.id,
      name: zoneName,
      zoneType: defaultZoneType,
      fillMaterial: '',
      areaSqft,
      polygonPoints: pts,
      colorOverride: null,
      notes: '',
      createdAt: new Date().toISOString()
    })

    if (result && 'data' in result && result.data) {
      ;(polygon as any).data = { zoneId: result.data.id }
      canvas.add(polygon)
      const newTotal = design.zones.reduce((s, z) => s + z.areaSqft, 0) + areaSqft
      void updateDesign.mutateAsync({ id: design.id, patch: { totalAreaSqft: newTotal } })
    }

    clearTempDots(canvas)
    canvas.renderAll()
    pushUndoSnapshot(canvas)
    setState((s) => ({
      ...s,
      polygonPoints: [],
      isDrawingPolygon: false,
      activeTool: 'select',
      isDirty: true,
      selectedZoneId: (result as any)?.data?.id ?? null,
    }))
  }

  // ─── Plant drop ──────────────────────────────────────────────────────────

  async function handlePlantDrop(plant: PlantCatalogItem, canvasX?: number, canvasY?: number) {
    if (!design) return
    const canvas = fabricRef.current
    if (!canvas) return

    const fabric = await import('fabric')
    const x = canvasX ?? (canvas.getWidth() / 2)
    const y = canvasY ?? (canvas.getHeight() / 2)
    const color = PLANT_TYPE_ICON_COLORS[plant.plantType]
    const radius = Math.max(8, (plant.matureSpreadFt * pixelsPerFoot) / 2)

    const circle = new fabric.Circle({ radius, fill: hexToRgba(color, 0.6), stroke: color, strokeWidth: 1.5, left: 0, top: 0, selectable: true })
    const label = new fabric.Text(plant.commonName, { fontSize: 9, fill: '#1a1a1a', left: radius, top: radius * 2 + 2, originX: 'center', selectable: false, evented: false })
    const group = new fabric.Group([circle, label], { left: x - radius, top: y - radius, selectable: true })

    const result = await upsertPlant.mutateAsync({
      designId: design.id,
      zoneId: null,
      plantCatalogId: plant.id,
      x, y,
      quantity: 1,
      spacingFt: plant.matureSpreadFt,
      rotation: 0,
      scaleMultiplier: 1,
      commonName: plant.commonName,
      plantType: plant.plantType,
    })

    if (result && 'data' in result) {
      ;(group as any).data = { plantId: result.data.id }
    }

    canvas.add(group)
    canvas.renderAll()
    pushUndoSnapshot(canvas)
    setState((s) => ({ ...s, isDirty: true }))
  }

  // ─── Canvas drag-drop ─────────────────────────────────────────────────────

  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const plantJson = e.dataTransfer.getData('plant-json')
    if (!plantJson) return
    const plant: PlantCatalogItem = JSON.parse(plantJson)
    const canvas = fabricRef.current
    if (!canvas) return
    const rect = canvasContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    void handlePlantDrop(plant, e.clientX - rect.left, e.clientY - rect.top)
  }

  // ─── Zone update ──────────────────────────────────────────────────────────

  async function handleZoneUpdate(patch: Partial<DesignZone>) {
    if (!design || !state.selectedZoneId) return
    const zone = design.zones.find((z) => z.id === state.selectedZoneId)
    if (!zone) return
    const updatedZone = { ...zone, ...patch }
    const canvas = fabricRef.current
    if (canvas && (patch.colorOverride !== undefined || patch.zoneType !== undefined)) {
      const color = patch.colorOverride ?? ZONE_TYPE_COLORS[updatedZone.zoneType]
      const obj = canvas.getObjects().find((o) => (o as any).data?.zoneId === zone.id)
      if (obj) {
        obj.set({ fill: hexToRgba(color, ZONE_TYPE_FILL_OPACITY), stroke: color })
        canvas.renderAll()
      }
    }
    await upsertZone.mutateAsync({ id: zone.id, designId: zone.designId, name: updatedZone.name, zoneType: updatedZone.zoneType, fillMaterial: updatedZone.fillMaterial, areaSqft: updatedZone.areaSqft, polygonPoints: updatedZone.polygonPoints, colorOverride: updatedZone.colorOverride, notes: updatedZone.notes, createdAt: new Date().toISOString() })
    setState((s) => ({ ...s, isDirty: true }))
  }

  async function handleZoneDelete() {
    if (!design || !state.selectedZoneId) return
    const canvas = fabricRef.current
    if (canvas) {
      const obj = canvas.getObjects().find((o) => (o as any).data?.zoneId === state.selectedZoneId)
      if (obj) canvas.remove(obj)
      canvas.renderAll()
    }
    await deleteZoneMutation.mutateAsync({ zoneId: state.selectedZoneId, designId: design.id })
    setState((s) => ({ ...s, selectedZoneId: null, hasSelection: false, isDirty: true }))
  }

  // ─── Delete selected ──────────────────────────────────────────────────────

  function deleteSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return

    const zoneId = (active as any)?.data?.zoneId
    const plantId = (active as any)?.data?.plantId
    const isBackground = (active as any)?.data?.isBackground

    canvas.remove(active)
    canvas.discardActiveObject()
    canvas.renderAll()
    pushUndoSnapshot(canvas)

    if (zoneId && design) void deleteZoneMutation.mutateAsync({ zoneId, designId: design.id })
    if (plantId && design) void deletePlantMutation.mutateAsync({ plantId, designId: design.id })
    if (isBackground && design) {
      void updateDesign.mutateAsync({ id: design.id, patch: { canvasState: { ...design.canvasState, backgroundImageUrl: null } } })
    }
    setState((s) => ({ ...s, hasSelection: false, selectedZoneId: null, isDirty: true }))
  }

  // ─── Background photo upload ──────────────────────────────────────────────

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return
    e.target.value = ''
    await addImageToCanvas(file, true)
  }

  // ─── Image library: upload any image ──────────────────────────────────────

  async function handleLibraryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !design) return
    e.target.value = ''
    setState((s) => ({ ...s, isUploadingImage: true }))

    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `designs/${design.id}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(DESIGN_IMAGES_BUCKET).upload(path, file, { upsert: false })
      if (error) { toast.error(`Failed to upload ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from(DESIGN_IMAGES_BUCKET).getPublicUrl(path)
      newUrls.push(publicUrl)
    }

    setState((s) => ({ ...s, isUploadingImage: false, imageLibrary: [...s.imageLibrary, ...newUrls] }))
    if (newUrls.length) toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded`)
  }

  // Add an image (File or URL) to canvas
  async function addImageToCanvas(source: File | string, isBackground = false) {
    const canvas = fabricRef.current
    if (!canvas) return
    const fabric = await import('fabric')

    let dataUrl: string
    if (typeof source === 'string') {
      dataUrl = source
    } else {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.readAsDataURL(source)
      })
    }

    try {
      const img: FabricImage = await fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' })
      img.set({
        left: 50, top: 50,
        selectable: true, evented: true, hasBorders: true, hasControls: true,
        data: isBackground ? { isBackground: true } : { isCanvasImage: true },
      })

      if (isBackground) {
        // Replace existing background
        const existing = canvas.getObjects().find((o) => (o as any).data?.isBackground)
        if (existing) canvas.remove(existing)
        img.scaleToWidth(canvas.width!)
        img.set({ left: 0, top: 0 })
        canvas.add(img)
        canvas.sendObjectToBack(img)
        // Persist backgroundImageUrl
        if (design) {
          void updateDesign.mutateAsync({ id: design.id, patch: { canvasState: { ...design.canvasState, backgroundImageUrl: dataUrl } } })
        }
      } else {
        // Scale to reasonable size — max 400px wide
        if (img.width! > 400) img.scaleToWidth(400)
        canvas.add(img)
        canvas.setActiveObject(img)
      }

      canvas.renderAll()
      pushUndoSnapshot(canvas)
      setState((s) => ({ ...s, isDirty: true }))
      toast.success(isBackground ? 'Background updated' : 'Image added to canvas')
    } catch {
      toast.error('Failed to load image')
    }
  }

  // ─── Manual save ─────────────────────────────────────────────────────────

  async function handleManualSave() {
    if (!design || !fabricRef.current) return
    setState((s) => ({ ...s, isSaving: true }))

    const canvas = fabricRef.current
    const fabricJson = JSON.stringify(canvas.toObject(['data']))
    const thumbnail = canvas.toDataURL({ format: 'png', multiplier: 0.3 })

    // Extract background image src — Fabric v7 FabricImage exposes getSrc()
    const bgObj = canvas.getObjects().find((o) => (o as any).data?.isBackground)
    let bgSrc: string | null = design.canvasState.backgroundImageUrl
    if (bgObj) {
      // Try v7 getSrc(), fall back to internal _element.src
      const anyBg = bgObj as any
      bgSrc = (typeof anyBg.getSrc === 'function' ? anyBg.getSrc() : null)
        ?? anyBg._element?.src
        ?? anyBg.src
        ?? bgSrc
    } else {
      // Background object was deleted
      bgSrc = null
    }

    const newCanvasState: CanvasState = {
      ...design.canvasState,
      fabricJson,
      backgroundImageUrl: bgSrc,
    }

    await updateDesign.mutateAsync({ id: design.id, patch: { canvasState: newCanvasState, thumbnailUrl: thumbnail } })
    setState((s) => ({ ...s, isSaving: false, isDirty: false }))
    toast.success('Design saved')
  }

  // ─── Scale calibration ────────────────────────────────────────────────────

  function handleCalibrated(ppf: number) {
    if (!design) return
    const newState: CanvasState = { ...design.canvasState, pixelsPerFoot: ppf }
    void updateDesign.mutateAsync({ id: design.id, patch: { canvasState: newState } })
    calibrationFirstPointRef.current = null
    calibrationPointsRef.current = null
    setState((s) => ({ ...s, calibrationFirstPoint: null, activeTool: 'select', isDirty: true }))
    toast.success(`Scale set: 1 ft = ${ppf.toFixed(1)} px`)
  }

  // ─── Grid ────────────────────────────────────────────────────────────────

  function toggleGrid() {
    setState((s) => ({ ...s, gridEnabled: !s.gridEnabled }))
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  function pushUndoSnapshot(canvas: FabricCanvas) {
    const json = JSON.stringify(canvas.toObject(['data']))
    undoStack.current.push(json)
    if (undoStack.current.length > CANVAS_DEFAULTS.UNDO_STACK_LIMIT) undoStack.current.shift()
    redoStack.current = []
    setState((s) => ({ ...s, canUndo: undoStack.current.length > 1, canRedo: false }))
  }

  function handleUndo() {
    const canvas = fabricRef.current
    if (!canvas || undoStack.current.length <= 1) return
    const current = undoStack.current.pop()!
    redoStack.current.push(current)
    const prev = undoStack.current[undoStack.current.length - 1]
    void canvas.loadFromJSON(JSON.parse(prev)).then(() => canvas.requestRenderAll())
    setState((s) => ({ ...s, canUndo: undoStack.current.length > 1, canRedo: redoStack.current.length > 0 }))
  }

  function handleRedo() {
    const canvas = fabricRef.current
    if (!canvas || redoStack.current.length === 0) return
    const next = redoStack.current.pop()!
    undoStack.current.push(next)
    void canvas.loadFromJSON(JSON.parse(next)).then(() => canvas.requestRenderAll())
    setState((s) => ({ ...s, canUndo: undoStack.current.length > 1, canRedo: redoStack.current.length > 0 }))
  }

  // ─── Layer visibility ─────────────────────────────────────────────────────

  function handleLayerToggle(layer: CanvasLayer) {
    if (!design) return
    const canvas = fabricRef.current
    const newVisible = !design.canvasState.layers[layer]

    if (canvas) {
      if (layer === 'background') {
        const bgObj = canvas.getObjects().find((o) => (o as any).data?.isBackground)
        if (bgObj) { bgObj.set({ visible: newVisible, evented: newVisible, selectable: newVisible }); canvas.renderAll() }
      } else if (layer === 'zones') {
        canvas.getObjects().forEach((o) => { if ((o as any).data?.zoneId) o.set({ visible: newVisible }) })
        canvas.renderAll()
      } else if (layer === 'plants') {
        canvas.getObjects().forEach((o) => { if ((o as any).data?.plantId) o.set({ visible: newVisible }) })
        canvas.renderAll()
      }
    }

    const newLayers = { ...design.canvasState.layers, [layer]: newVisible }
    void updateDesign.mutateAsync({ id: design.id, patch: { canvasState: { ...design.canvasState, layers: newLayers } } })
  }

  // ─── Export PNG ──────────────────────────────────────────────────────────

  async function exportPng(): Promise<string | null> {
    const canvas = fabricRef.current
    if (!canvas) return null
    return canvas.toDataURL({ format: 'png', multiplier: 2 })
  }

  // ─── Export PDF ──────────────────────────────────────────────────────────

  async function exportPdf(includeLegend: boolean) {
    if (!design || !fabricRef.current) return
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const imgData = fabricRef.current.toDataURL({ format: 'png', multiplier: 1.5 })
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text(design.name, 14, 14)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
    const customerName = customers.find((c) => c.id === design.customerId)?.name ?? ''
    pdf.text(`Customer: ${customerName}`, 14, 20)
    pdf.text(`Total area: ${formatArea(design.totalAreaSqft)}`, 14, 25)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    pdf.addImage(imgData, 'PNG', 14, 35, 180, 110)
    if (includeLegend && design.zones.length > 0) {
      pdf.addPage(); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text('Zone Legend', 14, 14)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
      let y = 24
      for (const zone of design.zones) {
        const color = zone.colorOverride ?? ZONE_TYPE_COLORS[zone.zoneType]
        pdf.setFillColor(color); pdf.rect(14, y - 3, 5, 5, 'F')
        pdf.text(`${zone.name} — ${zone.zoneType} — ${formatArea(zone.areaSqft)}`, 22, y)
        if (zone.fillMaterial) pdf.text(`  Material: ${zone.fillMaterial}`, 22, y + 4)
        y += 12
      }
    }
    pdf.save(`${design.name.replace(/\s+/g, '-')}.pdf`)
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async function drawTempDot(canvas: FabricCanvas, x: number, y: number) {
    const fabric = await import('fabric')
    const dot = new fabric.Circle({ radius: 4, fill: '#3b82f6', left: x - 4, top: y - 4, selectable: false, evented: false, data: { temp: true } })
    canvas.add(dot); canvas.renderAll()
  }

  function clearTempDots(canvas: FabricCanvas) {
    const temps = canvas.getObjects().filter((o) => (o as any).data?.temp)
    for (const t of temps) canvas.remove(t)
    canvas.renderAll()
  }

  async function drawZoneOnCanvas(canvas: FabricCanvas, zone: DesignZone, ppf: number, visible = true) {
    const fabric = await import('fabric')
    const color = zone.colorOverride ?? ZONE_TYPE_COLORS[zone.zoneType]
    const polygon = new fabric.Polygon(
      zone.polygonPoints.map((p) => ({ x: p.x, y: p.y })),
      { fill: hexToRgba(color, ZONE_TYPE_FILL_OPACITY), stroke: color, strokeWidth: 2, selectable: true, objectCaching: false, visible, data: { zoneId: zone.id } }
    )
    canvas.add(polygon)
  }

  async function drawPlantOnCanvas(canvas: FabricCanvas, plant: DesignPlant, visible = true) {
    const fabric = await import('fabric')
    const color = PLANT_TYPE_ICON_COLORS[plant.plantType]
    const radius = Math.max(8, (plant.spacingFt * pixelsPerFoot) / 2)
    const circle = new fabric.Circle({ radius, fill: hexToRgba(color, 0.6), stroke: color, strokeWidth: 1.5, left: 0, top: 0 })
    const label = new fabric.Text(plant.commonName, { fontSize: 9, fill: '#1a1a1a', left: radius, top: radius * 2 + 2, originX: 'center' })
    const group = new fabric.Group([circle, label], { left: plant.x - radius, top: plant.y - radius, selectable: true, visible, data: { plantId: plant.id } })
    canvas.add(group)
  }

  // ─── Navigation guard ─────────────────────────────────────────────────────

  function tryNavigate(path: string) {
    if (state.isDirty) {
      setState((s) => ({ ...s, showUnsavedPrompt: true, pendingNavigation: path }))
    } else {
      router.push(path)
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectedZone = design?.zones.find((z) => z.id === state.selectedZoneId) ?? null

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!design) return <div className="flex items-center justify-center h-screen text-muted-foreground">Design not found.</div>

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col ${state.fullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-screen'}`}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 px-2" onClick={() => tryNavigate('/dashboard/design')}>
          <ChevronLeft className="h-4 w-4" />Designs
        </Button>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate leading-none">{design.name}</h2>
          <p className="text-[10px] text-muted-foreground">{customers.find((c) => c.id === design.customerId)?.name ?? ''}</p>
        </div>

        <span className={`text-[10px] rounded-full px-2 py-0.5 shrink-0 ${DESIGN_STATUS_COLORS[design.status]}`}>
          {DESIGN_STATUS_LABELS[design.status]}
        </span>

        {state.isDirty && <span className="text-[10px] text-amber-500 shrink-0">● Unsaved</span>}
        {state.isSaving && <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>}

        {/* Save */}
        <Button size="sm" variant={state.isDirty ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => void handleManualSave()} disabled={state.isSaving}>
          <Save className="h-3.5 w-3.5 mr-1" />Save
        </Button>

        {/* Upload Photo (background) */}
        <label className="cursor-pointer shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <span><ImagePlus className="h-3.5 w-3.5 mr-1" />Upload Photo</span>
          </Button>
          <input type="file" className="sr-only" accept="image/*" onChange={handleBackgroundUpload} />
        </label>

        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setState((s) => ({ ...s, showMaterials: true }))}>
          <FileText className="h-3.5 w-3.5 mr-1" />Materials
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setState((s) => ({ ...s, showExport: true }))}>
          <Download className="h-3.5 w-3.5 mr-1" />Export
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setState((s) => ({ ...s, fullscreen: !s.fullscreen }))}>
          {state.fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <DesignToolbar
        activeTool={state.activeTool}
        onToolChange={setTool}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        gridEnabled={state.gridEnabled}
        onToggleGrid={toggleGrid}
        onCalibrate={() => {
          calibrationFirstPointRef.current = null
          calibrationPointsRef.current = null
          setState((s) => ({ ...s, activeTool: 'measure', calibrationFirstPoint: null }))
        }}
        onDeleteSelected={deleteSelected}
        hasSelection={state.hasSelection}
        pixelsPerFoot={pixelsPerFoot}
      />

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left panel */}
        <div className="w-52 border-r flex flex-col shrink-0 overflow-hidden bg-background">
          <div className="flex border-b">
            {(['layers', 'plants', 'images'] as const).map((tab) => (
              <button key={tab}
                className={`flex-1 py-1.5 text-[11px] font-medium transition-colors capitalize ${state.leftPanelTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setState((s) => ({ ...s, leftPanelTab: tab }))}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {state.leftPanelTab === 'layers' && (
              <ScrollArea className="h-full">
                <LayersPanel layers={design.canvasState.layers} onToggle={handleLayerToggle} zoneCount={design.zones.length} plantCount={design.plants.length} />
              </ScrollArea>
            )}
            {state.leftPanelTab === 'plants' && (
              <PlantLibraryPanel onPlantDrop={(plant) => void handlePlantDrop(plant)} />
            )}
            {state.leftPanelTab === 'images' && (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Image Library</p>
                  <label className="cursor-pointer w-full">
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs" asChild>
                      <span>
                        {state.isUploadingImage ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Images className="h-3.5 w-3.5 mr-1" />}
                        Add Images
                      </span>
                    </Button>
                    <input type="file" className="sr-only" accept="image/*" multiple onChange={handleLibraryImageUpload} />
                  </label>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 grid grid-cols-2 gap-1.5">
                    {state.imageLibrary.length === 0 && (
                      <p className="col-span-2 text-[10px] text-muted-foreground text-center py-4">No images yet. Upload some!</p>
                    )}
                    {state.imageLibrary.map((url) => (
                      <button key={url} className="rounded overflow-hidden border hover:border-primary transition-colors aspect-square bg-muted"
                        onClick={() => void addImageToCanvas(url, false)}
                        title="Click to add to canvas"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900 relative"
          ref={canvasContainerRef}
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Grid overlay */}
          {state.gridEnabled && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `linear-gradient(to right,rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,0.06) 1px,transparent 1px)`,
              backgroundSize: `${CANVAS_DEFAULTS.GRID_SIZE}px ${CANVAS_DEFAULTS.GRID_SIZE}px`,
            }} />
          )}

          <canvas ref={canvasElRef} className="block" />

          {/* Status bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm pointer-events-none">
            <span>{design.zones.length} zone{design.zones.length !== 1 ? 's' : ''}</span>
            <span>·</span><span>{formatArea(design.totalAreaSqft)}</span>
            <span>·</span><span>{design.plants.length} plant{design.plants.length !== 1 ? 's' : ''}</span>
            {state.activeTool !== 'select' && <><span>·</span><span className="text-primary font-medium capitalize">{state.activeTool} Mode</span></>}
          </div>
        </div>

        {/* Right panel — collapsible properties */}
        <div className={`border-l shrink-0 overflow-hidden bg-background flex flex-col transition-all duration-200 ${state.rightPanelCollapsed ? 'w-8' : 'w-52'}`}>
          {/* Collapse toggle */}
          <button
            className="flex items-center justify-center h-8 w-full border-b hover:bg-muted transition-colors shrink-0"
            onClick={() => setState((s) => ({ ...s, rightPanelCollapsed: !s.rightPanelCollapsed }))}
            title={state.rightPanelCollapsed ? 'Expand Properties' : 'Collapse Properties'}
          >
            {state.rightPanelCollapsed
              ? <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              : <div className="flex items-center w-full px-2 gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">Properties</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            }
          </button>

          {!state.rightPanelCollapsed && (
            <ScrollArea className="flex-1">
              {selectedZone ? (
                <ZonePropertiesPanel zone={selectedZone} onUpdate={(patch) => void handleZoneUpdate(patch)} onDelete={() => void handleZoneDelete()} />
              ) : state.hasSelection ? (
                <div className="p-3 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Shape Selected</p>
                  <p className="text-[11px] text-muted-foreground">Use the canvas handles to resize or move. Press <kbd className="bg-muted px-1 rounded text-[10px]">Del</kbd> to remove.</p>
                  <Separator />
                  <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={deleteSelected}>
                    Delete Shape
                  </Button>
                </div>
              ) : (
                <div className="p-3 text-[11px] text-muted-foreground space-y-2">
                  <p>Select a zone on the canvas to edit its properties.</p>
                  <Separator />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-[11px]">Keyboard shortcuts</p>
                    <p>• Select: <kbd className="bg-muted px-1 rounded text-[10px]">V</kbd></p>
                    <p>• Draw zone: <kbd className="bg-muted px-1 rounded text-[10px]">P</kbd></p>
                    <p>• Rectangle: <kbd className="bg-muted px-1 rounded text-[10px]">R</kbd></p>
                    <p>• Square: <kbd className="bg-muted px-1 rounded text-[10px]">Q</kbd></p>
                    <p>• Circle: <kbd className="bg-muted px-1 rounded text-[10px]">C</kbd></p>
                    <p>• Text: <kbd className="bg-muted px-1 rounded text-[10px]">T</kbd></p>
                    <p>• Set scale: <kbd className="bg-muted px-1 rounded text-[10px]">M</kbd></p>
                    <p>• Undo: <kbd className="bg-muted px-1 rounded text-[10px]">Ctrl+Z</kbd></p>
                    <p>• Save: <kbd className="bg-muted px-1 rounded text-[10px]">Ctrl+S</kbd></p>
                    <p>• Delete: <kbd className="bg-muted px-1 rounded text-[10px]">Del</kbd></p>
                    <p>• Pan: <kbd className="bg-muted px-1 rounded text-[10px]">Space</kbd></p>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>

      {/* ── Hint overlays ── */}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-1" style={{ top: '4.5rem' }}>
          {state.isDrawingPolygon && (
            <div className="bg-primary text-primary-foreground text-xs rounded-full px-3 py-1 shadow">
              {state.polygonPoints.length} pt{state.polygonPoints.length !== 1 ? 's' : ''} — Double-click to close
            </div>
          )}
          {state.activeTool === 'measure' && !state.calibrationFirstPoint && (
            <div className="bg-amber-500 text-white text-xs rounded-full px-3 py-1 shadow">Click first point</div>
          )}
          {state.activeTool === 'measure' && state.calibrationFirstPoint && !state.showCalibration && (
            <div className="bg-amber-500 text-white text-xs rounded-full px-3 py-1 shadow">Click second point</div>
          )}
          {['rectangle', 'square', 'circle'].includes(state.activeTool) && (
            <div className="bg-primary/90 text-primary-foreground text-xs rounded-full px-3 py-1 shadow">
              Click & drag to draw {state.activeTool}
            </div>
          )}
          {state.activeTool === 'text' && (
            <div className="bg-primary/90 text-primary-foreground text-xs rounded-full px-3 py-1 shadow">
              Click to place text label
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Dialogs ── */}
      <ScaleCalibrationDialog
        open={state.showCalibration}
        onOpenChange={(open) => {
          setState((s) => ({ ...s, showCalibration: open }))
          if (!open) {
            calibrationFirstPointRef.current = null
            calibrationPointsRef.current = null
            setState((s) => ({ ...s, calibrationFirstPoint: null, activeTool: 'select' }))
          }
        }}
        calibrationPoints={calibrationPointsRef.current}
        onCalibrated={handleCalibrated}
      />

      <ExportDialog open={state.showExport} onOpenChange={(open) => setState((s) => ({ ...s, showExport: open }))} designName={design.name} onExportPng={exportPng} onExportPdf={exportPdf} />

      <MaterialsListDialog open={state.showMaterials} onOpenChange={(open) => setState((s) => ({ ...s, showMaterials: open }))} designId={design.id} designName={design.name} />

      {/* ── Unsaved changes prompt ── */}
      <AlertDialog open={state.showUnsavedPrompt} onOpenChange={(open) => setState((s) => ({ ...s, showUnsavedPrompt: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes. Do you want to save before leaving?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setState((s) => ({ ...s, showUnsavedPrompt: false, pendingNavigation: null }))}>
              Stay
            </AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              setState((s) => ({ ...s, showUnsavedPrompt: false }))
              if (state.pendingNavigation) router.push(state.pendingNavigation)
            }}>
              Leave without saving
            </Button>
            <AlertDialogAction onClick={async () => {
              await handleManualSave()
              setState((s) => ({ ...s, showUnsavedPrompt: false }))
              if (state.pendingNavigation) router.push(state.pendingNavigation)
            }}>
              Save & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}