'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  OUTREACH_STAGE_LABELS, OUTREACH_TARGET_TYPE_LABELS,
  type OutreachProspect,
} from '@/types/outreach-types'
import { ConvertProspectDialog } from './convert-prospect-dialog'

const CONVERTIBLE_STAGES = ['New', 'Contacted', 'Responded', 'Qualified', 'Partner']

interface ProspectViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
}

export function ProspectViewDialog({ open, onOpenChange, prospect }: ProspectViewDialogProps) {
  const [convertOpen, setConvertOpen] = useState(false)

  if (!prospect) return null

  const canConvert = CONVERTIBLE_STAGES.includes(prospect.stage)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Prospect details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm flex-1 overflow-y-auto">
            <div><span className="font-medium">Company:</span> {prospect.company || '—'}</div>
            <div><span className="font-medium">Contact:</span> {prospect.name || '—'}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline">{OUTREACH_TARGET_TYPE_LABELS[prospect.targetType]}</Badge>
              {prospect.location && <Badge variant="outline">{prospect.location}</Badge>}
              {prospect.industry && <Badge variant="outline">{prospect.industry}</Badge>}
            </div>
            <div><span className="font-medium">Stage:</span> {OUTREACH_STAGE_LABELS[prospect.stage]}</div>
            <div><span className="font-medium">Company size:</span> {prospect.companySize || '—'}</div>
            <div><span className="font-medium">Email:</span> {prospect.email || '—'}</div>
            <div><span className="font-medium">Phone:</span> {prospect.phone || '—'}</div>
            <div><span className="font-medium">Lead source:</span> {prospect.leadSource || '—'}</div>
            {prospect.notes && (
              <div className="mt-2">
                <span className="font-medium">Notes:</span>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{prospect.notes}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canConvert && (
              <Button
                type="button"
                onClick={() => { onOpenChange(false); setConvertOpen(true) }}
              >
                <UserPlus className="size-4 mr-2" />
                Convert to Customer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConvertProspectDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        prospect={prospect}
      />
    </>
  )
}