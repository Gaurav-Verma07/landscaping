'use client'

import { MessageSquare, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  OUTREACH_STAGE_LABELS,
  type OutreachStage,
} from '@/types/outreach-types'

const STAGES: OutreachStage[] = ['New', 'Contacted', 'Responded', 'Qualified', 'Partner', 'Archived']

interface OutreachBulkToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onSendMessage: () => void
  onMoveToStage: (stage: OutreachStage) => void
  onDeleteSelected: () => void
}

export function OutreachBulkToolbar({
  selectedCount,
  onClearSelection,
  onSendMessage,
  onMoveToStage,
  onDeleteSelected,
}: OutreachBulkToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2 ml-2">
        <Button size="sm" variant="outline" onClick={onSendMessage}>
          <MessageSquare className="size-4 mr-1" />
          Send Message
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Move to stage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {STAGES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onMoveToStage(s)}>
                {OUTREACH_STAGE_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDeleteSelected}>
          <Trash2 className="size-4 mr-1" />
          Delete
        </Button>
      </div>
      <Button size="sm" variant="ghost" className="ml-auto" onClick={onClearSelection}>
        <X className="size-4" />
      </Button>
    </div>
  )
}