'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { useSupervisorOverride } from '@/lib/hooks/use-labor'
import type { TimeEntry } from '@/types/labor-types'

interface SupervisorOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: TimeEntry | null
  employeeName: string
}

export function SupervisorOverrideDialog({
  open,
  onOpenChange,
  entry,
  employeeName,
}: SupervisorOverrideDialogProps) {
  const overrideMutation = useSupervisorOverride()
  const [reason, setReason] = useState('')

  const handleApprove = async () => {
    if (!entry) return
    if (!reason.trim()) {
      toast.error('A reason is required for the override')
      return
    }

    const result:any = await overrideMutation.mutateAsync({
      timeEntryId: entry.id,
      reason: reason.trim(),
    })

    if ('error' in result && result.error) {
      toast.error(result.error as string)
      return
    }

    toast.success('GPS override approved')
    onOpenChange(false)
    setReason('')
  }

  const distanceText =
    entry?.distanceMeters != null
      ? `${entry.distanceMeters}m from the job site`
      : 'outside the verified radius'

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setReason('')
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-amber-500" />
            GPS override
          </DialogTitle>
          <DialogDescription>
            <strong>{employeeName}</strong> clocked in {distanceText}. Approving this override will mark the entry as valid.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>Reason *</FieldLabel>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. GPS signal was poor — crew confirmed on site by phone"
            rows={3}
            disabled={overrideMutation.isPending}
            autoFocus
          />
          <FieldDescription>This reason is saved to the audit record.</FieldDescription>
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason('')
              onOpenChange(false)
            }}
            disabled={overrideMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!reason.trim() || overrideMutation.isPending}
          >
            {overrideMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Approving…
              </>
            ) : (
              'Approve override'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}