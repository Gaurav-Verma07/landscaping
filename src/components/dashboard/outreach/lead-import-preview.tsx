'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UnifiedLead } from '@/lib/actions/lead-generation'

interface LeadImportPreviewProps {
  selected: UnifiedLead[]
  targetType: string
  onRemove: (sourceId: string) => void
}

export function LeadImportPreview({ selected, targetType, onRemove }: LeadImportPreviewProps) {
  if (selected.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {selected.length} lead{selected.length !== 1 ? 's' : ''} selected to import
        </p>
        <Badge variant="secondary">{targetType}</Badge>
      </div>
      <div className="max-h-[200px] overflow-y-auto space-y-1.5 rounded-lg border p-2">
        {selected.map((lead) => (
          <div
            key={lead.source_id}
            className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{lead.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[lead.city, lead.postcode].filter(Boolean).join(', ') || lead.raw_address || '—'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onRemove(lead.source_id)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}