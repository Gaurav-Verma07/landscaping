'use client'

// components/dashboard/design/layers-panel.tsx

import { Eye, EyeOff, Image as ImageIcon, Trees, Leaf, Type, Ruler } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { CANVAS_LAYER_LABELS } from '@/enums/design-enums'
import type { CanvasLayer } from '@/enums/design-enums'
import type { CanvasState } from '@/types/design-types'

interface Props {
  layers: CanvasState['layers']
  onToggle: (layer: CanvasLayer) => void
  zoneCount: number
  plantCount: number
}

const LAYER_ICONS: Record<CanvasLayer, React.ReactNode> = {
  background:   <ImageIcon className="h-3.5 w-3.5" />,
  zones:        <Trees className="h-3.5 w-3.5" />,
  plants:       <Leaf className="h-3.5 w-3.5" />,
  labels:       <Type className="h-3.5 w-3.5" />,
  measurements: <Ruler className="h-3.5 w-3.5" />,
}

const LAYER_ORDER: CanvasLayer[] = ['background', 'zones', 'plants', 'labels', 'measurements']

export function LayersPanel({ layers, onToggle, zoneCount, plantCount }: Props) {
  return (
    <div className="p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Layers
      </p>
      <div className="space-y-1">
        {LAYER_ORDER.map((layer) => {
          const visible = layers[layer]
          return (
            <div
              key={layer}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <span className="text-muted-foreground">{LAYER_ICONS[layer]}</span>
              <span className="flex-1 text-sm">{CANVAS_LAYER_LABELS[layer]}</span>
              {layer === 'zones' && (
                <span className="text-xs text-muted-foreground">{zoneCount}</span>
              )}
              {layer === 'plants' && (
                <span className="text-xs text-muted-foreground">{plantCount}</span>
              )}
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onToggle(layer)}
                title={visible ? 'Hide layer' : 'Show layer'}
              >
                {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-50" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}