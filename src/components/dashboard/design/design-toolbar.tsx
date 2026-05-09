'use client'

// components/dashboard/design/design-toolbar.tsx

import {
  MousePointer2,
  Pentagon,
  Square,
  Circle,
  Type,
  Ruler,
  Hand,
  Undo2,
  Redo2,
  Grid3X3,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Toggle } from '@/components/ui/toggle'
import { CANVAS_TOOL_LABELS, CanvasTool } from '@/enums/design-enums'

interface Props {
  activeTool: CanvasTool
  onToolChange: (tool: CanvasTool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  gridEnabled: boolean
  onToggleGrid: () => void
  onCalibrate: () => void
  onDeleteSelected: () => void
  hasSelection: boolean
  pixelsPerFoot: number
}

const TOOLS: { tool: CanvasTool; icon: React.ReactNode; kbd?: string }[] = [
  { tool: 'select',    icon: <MousePointer2 className="h-4 w-4" />, kbd: 'V' },
  { tool: 'polygon',  icon: <Pentagon className="h-4 w-4" />,       kbd: 'P' },
  { tool: 'rectangle',icon: <Square className="h-4 w-4" />,         kbd: 'R' },
  { tool: 'circle',   icon: <Circle className="h-4 w-4" />,         kbd: 'C' },
  { tool: 'text',     icon: <Type className="h-4 w-4" />,           kbd: 'T' },
  { tool: 'measure',  icon: <Ruler className="h-4 w-4" />,          kbd: 'M' },
  { tool: 'pan',      icon: <Hand className="h-4 w-4" />,           kbd: 'Space' },
]

export function DesignToolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridEnabled,
  onToggleGrid,
  onCalibrate,
  onDeleteSelected,
  hasSelection,
  pixelsPerFoot,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-background/95 backdrop-blur-sm">
      {/* Drawing tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ tool, icon, kbd }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={activeTool === tool}
                onPressedChange={() => onToolChange(tool)}
                className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {icon}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {CANVAS_TOOL_LABELS[tool]}
              {kbd && <span className="ml-1.5 text-muted-foreground">({kbd})</span>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Undo / Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Grid */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            size="sm"
            pressed={gridEnabled}
            onPressedChange={onToggleGrid}
            className="h-8 w-8 data-[state=on]:bg-muted"
          >
            <Grid3X3 className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Toggle Grid (G)</TooltipContent>
      </Tooltip>

      {/* Calibrate */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onCalibrate}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Set Scale</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Delete selected */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:opacity-30"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Delete selected (Del)</TooltipContent>
      </Tooltip>

      {/* Scale indicator */}
      <div className="ml-auto text-xs text-muted-foreground px-2 tabular-nums">
        1 ft = {pixelsPerFoot.toFixed(1)} px
      </div>
    </div>
  )
}