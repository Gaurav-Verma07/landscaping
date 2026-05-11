'use client'

// components/dashboard/design/design-list-workspace.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Pencil, Trash2, Eye, FileText, Leaf, SquarePen } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

import { useDesigns, useDeleteDesign } from '@/lib/hooks/use-design'
import { useCustomers } from '@/lib/hooks/use-customers'
import { DESIGN_STATUS_LABELS, DESIGN_STATUS_COLORS } from '@/enums/design-enums'
import type { LandscapeDesign } from '@/types/design-types'
import { NewDesignDialog } from './new-design-dialog'
import { formatArea } from '@/utils/canva-utils'


export function DesignListWorkspace() {
  const router = useRouter()
  const { data: designs = [], isLoading } = useDesigns()
  const { data: customers = [] } = useCustomers()
  const deleteDesign = useDeleteDesign()

  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LandscapeDesign | null>(null)

  const customerMap = new Map(customers.map((c) => [c.id, c.name]))

  function handleOpen(id: string) {
    router.push(`/dashboard/design/${id}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteDesign.mutateAsync(deleteTarget.id)
    toast.success('Design deleted')
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Landscape Designs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {designs.length} design{designs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Design
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {designs.length === 0 ? (
          <Empty
            icon={<SquarePen className="h-10 w-10 text-muted-foreground/40" />}
            title="No designs yet"
            description="Create your first landscape design to get started."
            action={
              <Button onClick={() => setNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Design
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                customerName={customerMap.get(design.customerId) ?? 'Unknown'}
                onOpen={() => handleOpen(design.id)}
                onDelete={() => setDeleteTarget(design)}
              />
            ))}
          </div>
        )}
      </div>

      <NewDesignDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete design?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; and all its zones and plant placements will be
              permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Design Card ─────────────────────────────────────────────────────────────

function DesignCard({
  design,
  customerName,
  onOpen,
  onDelete,
}: {
  design: LandscapeDesign
  customerName: string
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-muted overflow-hidden">
        {design.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={design.thumbnailUrl}
            alt={design.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              DESIGN_STATUS_COLORS[design.status]
            }`}
          >
            {DESIGN_STATUS_LABELS[design.status]}
          </span>
        </div>
        {/* Action buttons on hover */}
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onOpen}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3 space-y-1">
        <p className="font-medium text-sm leading-tight truncate">{design.name}</p>
        <p className="text-xs text-muted-foreground truncate">{customerName}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {design.zones.length} zone{design.zones.length !== 1 ? 's' : ''} ·{' '}
            {formatArea(design.totalAreaSqft)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}