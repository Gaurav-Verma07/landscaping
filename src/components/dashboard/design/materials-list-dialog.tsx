'use client'

// components/dashboard/design/materials-list-dialog.tsx

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, ArrowRight, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useMaterialsList, useDesignToQuote } from '@/lib/hooks/use-design'
import { MATERIAL_UNIT_LABELS, type MaterialUnit } from '@/enums/design-enums'
import { formatArea } from '@/utils/canva-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  designId: string
  designName: string
}

export function MaterialsListDialog({ open, onOpenChange, designId, designName }: Props) {
  const router = useRouter()
  const { data: materialsList, isLoading } = useMaterialsList(open ? designId : undefined)
  const designToQuote = useDesignToQuote()

  async function handleSendToQuote() {
    const result = await designToQuote.mutateAsync(designId)
    if ('error' in result) {
      toast.error(result.error as string)
      return
    }
    toast.success(`Quote ${result.quoteNumber} created`)
    onOpenChange(false)
    router.push('/dashboard/quotes')
  }

  const totalEstimated =
    materialsList?.items.reduce((s, i) => s + i.estimatedTotal, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Materials List — {designName}
          </DialogTitle>
          <DialogDescription>
            Auto-computed from zone areas and plant placements. Prices pulled from your material catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !materialsList || materialsList.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No materials to display. Add zones and plants to the canvas first.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialsList.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {MATERIAL_UNIT_LABELS[item.unit as MaterialUnit] ?? item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.estimatedUnitPrice > 0
                        ? `$${item.estimatedUnitPrice.toFixed(2)}`
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.estimatedTotal > 0
                        ? `$${item.estimatedTotal.toFixed(2)}`
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {materialsList && materialsList.items.length > 0 && (
          <div className="flex items-center justify-between text-sm border-t pt-3">
            <span className="text-muted-foreground">
              {formatArea(materialsList.totalAreaSqft)} · {materialsList.totalPlants} plants
            </span>
            <span className="font-semibold">
              Est. total: {totalEstimated > 0 ? `$${totalEstimated.toFixed(2)}` : 'Add prices to catalog'}
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSendToQuote}
            disabled={designToQuote.isPending || isLoading || !materialsList?.items.length}
          >
            {designToQuote.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating Quote…</>
            ) : (
              <><ArrowRight className="h-4 w-4 mr-1.5" /> Send to Quote</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}