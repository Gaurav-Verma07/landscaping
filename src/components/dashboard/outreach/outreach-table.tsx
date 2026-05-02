'use client'

import {
  IconDotsVertical, IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  OUTREACH_STAGE_LABELS, OUTREACH_TARGET_TYPE_LABELS,
  type OutreachProspect, type OutreachStage,
} from '@/types/outreach-types'
import { MessageSquare, Inbox, UserPlus } from 'lucide-react'

const STAGES: OutreachStage[] = ['New', 'Contacted', 'Responded', 'Qualified', 'Partner', 'Archived']
const ENGAGED_STAGES: OutreachStage[] = ['Contacted', 'Responded', 'Qualified', 'Partner']
const CONVERTIBLE_STAGES: OutreachStage[] = ['New', 'Contacted', 'Responded', 'Qualified', 'Partner']

interface OutreachTableProps {
  paged: OutreachProspect[]
  filtered: OutreachProspect[]
  selectedIds: Set<string>
  pageIndex: number
  pageCount: number
  pageSize: number
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onView: (p: OutreachProspect) => void
  onEdit: (p: OutreachProspect) => void
  onSendMessage: (p: OutreachProspect) => void
  onConvert: (p: OutreachProspect) => void
  onMoveStage: (id: string, stage: OutreachStage) => void
  onDelete: (id: string) => void
  onPageChange: (index: number) => void
  onPageSizeChange: (size: number) => void
}

export function OutreachTable({
  paged, filtered, selectedIds, pageIndex, pageCount, pageSize,
  onToggleSelect, onToggleSelectAll, onView, onEdit, onSendMessage,
  onConvert, onMoveStage, onDelete, onPageChange, onPageSizeChange,
}: OutreachTableProps) {
  const router = useRouter()
  const allSelected = paged.length > 0 && paged.every((p) => selectedIds.has(p.id))

  const getStageBadgeVariant = (stage: OutreachStage) => {
    if (stage === 'Partner' || stage === 'Qualified') return 'default'
    if (stage === 'Contacted') return 'secondary'
    if (stage === 'Responded') return 'default'
    if (stage === 'Archived') return 'secondary'
    return 'outline'
  }

  const getStageBadgeClass = (stage: OutreachStage) => {
    if (stage === 'Responded') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (stage === 'Contacted') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    return ''
  }

  if (paged.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {filtered.length === 0 ? 'No prospects yet.' : 'No prospects match your filters.'}
      </p>
    )
  }

  return (
    <TooltipProvider>
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
              </TableHead>
              <TableHead>Company / Name</TableHead>
              <TableHead>Target type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((p) => (
              <TableRow key={p.id} className={selectedIds.has(p.id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => onToggleSelect(p.id)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium truncate">
                    {p.company || p.name || 'Unnamed prospect'}
                  </div>
                  {p.name && p.company && (
                    <div className="text-xs text-muted-foreground truncate">{p.name}</div>
                  )}
                </TableCell>
                <TableCell>{OUTREACH_TARGET_TYPE_LABELS[p.targetType]}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={getStageBadgeVariant(p.stage)}
                      className={`text-xs ${getStageBadgeClass(p.stage)}`}
                    >
                      {OUTREACH_STAGE_LABELS[p.stage]}
                    </Badge>
                    {ENGAGED_STAGES.includes(p.stage) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => router.push(`/dashboard/communications?prospectId=${p.id}`)}
                          >
                            <Inbox className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View communications</TooltipContent>
                      </Tooltip>
                    )}
                    {CONVERTIBLE_STAGES.includes(p.stage) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-green-600"
                            onClick={() => onConvert(p)}
                          >
                            <UserPlus className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convert to Customer</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>{p.location}</TableCell>
                <TableCell className="truncate max-w-[140px]">{p.email}</TableCell>
                <TableCell className="truncate max-w-[120px]">{p.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(p)}>View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(p)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendMessage(p)}>
                        <MessageSquare className="size-4 mr-2" />Send Message
                      </DropdownMenuItem>
                      {ENGAGED_STAGES.includes(p.stage) && (
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/communications?prospectId=${p.id}`)}>
                          <Inbox className="size-4 mr-2" />View communications
                        </DropdownMenuItem>
                      )}
                      {CONVERTIBLE_STAGES.includes(p.stage) && (
                        <DropdownMenuItem onClick={() => onConvert(p)} className="text-green-600 focus:text-green-600">
                          <UserPlus className="size-4 mr-2" />Convert to Customer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {STAGES.filter((s) => s !== p.stage).map((s) => (
                        <DropdownMenuItem key={s} onClick={() => onMoveStage(p.id, s)}>
                          Move to {OUTREACH_STAGE_LABELS[s]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(p.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : pageIndex * pageSize + 1}–
            {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(0)} disabled={pageIndex === 0}>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0}>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))} disabled={pageIndex >= pageCount - 1}>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    </TooltipProvider>
  )
}