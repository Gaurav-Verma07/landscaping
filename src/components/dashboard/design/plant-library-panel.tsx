'use client'

// components/dashboard/design/plant-library-panel.tsx

import { useRef, useState, useMemo } from 'react'
import { Search, Plus, Leaf, Upload, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePlantCatalog, useUploadPlantAsset } from '@/lib/hooks/use-design'
import {
  PLANT_TYPES,
  PLANT_TYPE_LABELS,
  PLANT_TYPE_ICON_COLORS,
  SUN_REQUIREMENTS,
  SUN_REQUIREMENT_LABELS,
  WATER_NEEDS,
  WATER_NEED_LABELS,
} from '@/enums/design-enums'
import type { PlantCatalogItem } from '@/types/design-types'
import type { PlantType, SunRequirement, WaterNeed } from '@/enums/design-enums'
import { toast } from 'sonner'

interface Props {
  onPlantDrop: (plant: PlantCatalogItem) => void
}

export function PlantLibraryPanel({ onPlantDrop }: Props) {
  const { data: catalog = [], isLoading } = usePlantCatalog()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PlantType | 'all'>('all')
  const [sunFilter, setSunFilter] = useState<SunRequirement | 'all'>('all')
  const [waterFilter, setWaterFilter] = useState<WaterNeed | 'all'>('all')

  const filtered = useMemo(() => {
    let list = catalog
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.commonName.toLowerCase().includes(q) ||
          p.botanicalName.toLowerCase().includes(q)
      )
    }
    if (typeFilter !== 'all') list = list.filter((p) => p.plantType === typeFilter)
    if (sunFilter !== 'all') list = list.filter((p) => p.sunRequirement === sunFilter)
    if (waterFilter !== 'all') list = list.filter((p) => p.waterNeed === waterFilter)
    return list
  }, [catalog, search, typeFilter, sunFilter, waterFilter])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Plant Library
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search plants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="space-y-1.5">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PlantType | 'all')}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PLANT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{PLANT_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Select value={sunFilter} onValueChange={(v) => setSunFilter(v as SunRequirement | 'all')}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Sun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any sun</SelectItem>
                {SUN_REQUIREMENTS.map((s) => (
                  <SelectItem key={s} value={s}>{SUN_REQUIREMENT_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={waterFilter} onValueChange={(v) => setWaterFilter(v as WaterNeed | 'all')}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Water" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any water</SelectItem>
                {WATER_NEEDS.map((w) => (
                  <SelectItem key={w} value={w}>{WATER_NEED_LABELS[w]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} plant{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            : filtered.map((plant) => (
                <PlantLibraryItem
                  key={plant.id}
                  plant={plant}
                  onAdd={() => onPlantDrop(plant)}
                />
              ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Individual plant row ──────────────────────────────────────────────────

function PlantLibraryItem({
  plant,
  onAdd,
}: {
  plant: PlantCatalogItem
  onAdd: () => void
}) {
  const iconColor = PLANT_TYPE_ICON_COLORS[plant.plantType]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate: uploadAsset, isPending: isUploading } = useUploadPlantAsset()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadAsset(
      { plantId: plant.id, file, assetType: 'icon' },
      {
        onSuccess: (res) => {
          if ('error' in res) toast.error(res.error)
          else toast.success(`Icon updated for ${plant.commonName}`)
        },
        onError: () => toast.error('Upload failed'),
      }
    )
    // reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer group"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('plant-id', plant.id)
        e.dataTransfer.setData('plant-json', JSON.stringify(plant))
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Icon — click to upload */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="relative h-8 w-8 rounded-full flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundColor: iconColor + '28' }}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: iconColor }} />
            ) : plant.iconUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={plant.iconUrl} alt="" className="h-5 w-5 object-contain" />
                <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-3 w-3 text-white" />
                </span>
              </>
            ) : (
              <>
                <Leaf className="h-4 w-4" style={{ color: iconColor }} />
                <span className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-3 w-3 text-white" />
                </span>
              </>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          {plant.iconUrl ? 'Replace icon' : 'Upload icon'}
        </TooltipContent>
      </Tooltip>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{plant.commonName}</p>
        <p className="text-[10px] text-muted-foreground italic truncate">{plant.botanicalName}</p>
        <div className="flex gap-1 mt-0.5">
          <span className="text-[10px] bg-muted rounded px-1">
            {PLANT_TYPE_LABELS[plant.plantType]}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {plant.matureHeightFt}ft
          </span>
        </div>
      </div>

      {/* Add button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => { e.stopPropagation(); onAdd() }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Add to canvas</TooltipContent>
      </Tooltip>
    </div>
  )
}