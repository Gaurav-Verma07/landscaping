'use client'

// components/dashboard/design/scale-calibration-dialog.tsx

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import type { ZonePoint } from '@/types/design-types'
import { calibrateScale } from '../../../../utils/canva-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  calibrationPoints: [ZonePoint, ZonePoint] | null
  onCalibrated: (pixelsPerFoot: number) => void
}

export function ScaleCalibrationDialog({
  open,
  onOpenChange,
  calibrationPoints,
  onCalibrated,
}: Props) {
  const [distanceFt, setDistanceFt] = useState('')

  function handleApply() {
    const ft = parseFloat(distanceFt)
    if (!calibrationPoints || isNaN(ft) || ft <= 0) return

    const ppf = calibrateScale(calibrationPoints[0], calibrationPoints[1], ft)
    onCalibrated(ppf)
    onOpenChange(false)
    setDistanceFt('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Scale</DialogTitle>
          <DialogDescription>
            You clicked two points on the canvas. Enter the real-world distance between them.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel required>Distance between points (feet)</FieldLabel>
          <Input
            type="number"
            min="0.1"
            step="0.5"
            placeholder="e.g. 20"
            value={distanceFt}
            onChange={(e) => setDistanceFt(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleApply() }}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!distanceFt || parseFloat(distanceFt) <= 0}>
            Apply Scale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}