'use client'

// components/dashboard/design/zone-properties-panel.tsx

import { useEffect, useState } from 'react'
import { Trash2, ChevronsUpDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import {
  ZONE_TYPES,
  ZONE_TYPE_LABELS,
  ZONE_TYPE_COLORS,
} from '@/enums/design-enums'
import type { ZoneType } from '@/enums/design-enums'
import type { DesignZone } from '@/types/design-types'
import { useMaterials } from '@/lib/hooks/use-billing'
import { formatArea } from '../../../../utils/canva-utils'
import { cn } from '../../../../utils/utils'

interface Props {
  zone: DesignZone
  onUpdate: (patch: Partial<DesignZone>) => void
  onDelete: () => void
}

export function ZonePropertiesPanel({ zone, onUpdate, onDelete }: Props) {
  const [name, setName] = useState(zone.name)
  const [notes, setNotes] = useState(zone.notes)
  const [fillMaterial, setFillMaterial] = useState(zone.fillMaterial)
  const [materialOpen, setMaterialOpen] = useState(false)

  const { data: materials = [] } = useMaterials()

  // Sync when selected zone changes
  useEffect(() => {
    setName(zone.name)
    setNotes(zone.notes)
    setFillMaterial(zone.fillMaterial)
  }, [zone.id, zone.name, zone.notes, zone.fillMaterial])

  function commitName() {
    if (name.trim() && name.trim() !== zone.name) {
      onUpdate({ name: name.trim() })
    }
  }

  function commitNotes() {
    if (notes !== zone.notes) onUpdate({ notes })
  }

  function selectMaterial(value: string) {
    setFillMaterial(value)
    setMaterialOpen(false)
    if (value !== zone.fillMaterial) onUpdate({ fillMaterial: value })
  }

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Zone Properties
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Area badge */}
      <div className="rounded-lg bg-muted px-3 py-2 text-center">
        <p className="text-lg font-semibold">{formatArea(zone.areaSqft)}</p>
        <p className="text-xs text-muted-foreground">Calculated area</p>
      </div>

      <Field>
        <FieldLabel>Zone Name</FieldLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') commitName() }}
          className="h-8 text-sm"
        />
      </Field>

      <Field>
        <FieldLabel>Zone Type</FieldLabel>
        <Select
          value={zone.zoneType}
          onValueChange={(v) => onUpdate({ zoneType: v as ZoneType })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ZONE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full inline-block shrink-0"
                    style={{ background: ZONE_TYPE_COLORS[t] }}
                  />
                  {ZONE_TYPE_LABELS[t]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Fill Material</FieldLabel>
        <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-8 w-full justify-between text-sm font-normal"
            >
              <span className={cn('truncate', !fillMaterial && 'text-muted-foreground')}>
                {fillMaterial || 'Select material…'}
              </span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search materials…" className="h-8 text-sm" />
              <CommandList>
                <CommandEmpty>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => selectMaterial(fillMaterial)}
                  >
                    Use &quot;{fillMaterial || '—'}&quot;
                  </button>
                </CommandEmpty>
                <CommandGroup>
                  {materials.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.name}
                      onSelect={selectMaterial}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          fillMaterial === m.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.unit && (
                        <span className="text-xs text-muted-foreground ml-2">{m.unit}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Field>

      <Field>
        <FieldLabel>Color</FieldLabel>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(ZONE_TYPE_COLORS).map(([type, color]) => (
            <button
              key={type}
              className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background: color,
                borderColor:
                  (zone.colorOverride ?? ZONE_TYPE_COLORS[zone.zoneType]) === color
                    ? '#000'
                    : 'transparent',
              }}
              title={ZONE_TYPE_LABELS[type as ZoneType]}
              onClick={() => onUpdate({ colorOverride: color })}
            />
          ))}
          <input
            type="color"
            className="h-6 w-6 rounded-full border cursor-pointer"
            value={zone.colorOverride ?? ZONE_TYPE_COLORS[zone.zoneType]}
            onChange={(e) => onUpdate({ colorOverride: e.target.value })}
            title="Custom color"
          />
        </div>
      </Field>

      <Separator />

      <Field>
        <FieldLabel>Notes</FieldLabel>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={commitNotes}
          placeholder="Planting notes, conditions…"
          rows={3}
          className="text-sm resize-none"
        />
      </Field>
    </div>
  )
}