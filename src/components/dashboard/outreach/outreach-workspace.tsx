'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOutreachStore } from '@/lib/outreach-store'
import { useCustomerStore } from '@/lib/customer-store'
import { useCommunicationStore } from '@/lib/communication-store'
import { type OutreachProspect, type OutreachStage, type OutreachTargetType } from '@/lib/outreach-types'
import { OutreachStats } from './outreach-stats'
import { OutreachFilters } from './outreach-filters'
import { OutreachBulkToolbar } from './outreach-bulk-toolbar'
import { OutreachTable } from './outreach-table'
import { ProspectFormDialog } from './prospect-form-dialog'
import { ProspectViewDialog } from './prospect-view-dialog'
import { ProspectSendMessageDialog } from './prospect-send-message-dialog'
import { FindLeadsDialog } from './find-leads-dialog'

let initialized = false

export function OutreachWorkspace() {
  const { prospects, moveProspectStage, deleteProspect, refresh, bulkDelete, bulkUpdate } = useOutreachStore()
  const { refresh: refreshCustomers } = useCustomerStore()
  const { refresh: refreshComms } = useCommunicationStore()

  // Filters
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  // Pagination
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OutreachProspect | null>(null)
  const [viewing, setViewing] = useState<OutreachProspect | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [messagingProspect, setMessagingProspect] = useState<OutreachProspect | null>(null)
  const [messageOpen, setMessageOpen] = useState(false)
  const [findLeadsOpen, setFindLeadsOpen] = useState(false)

  // Lazy load
  useEffect(() => {
    if (initialized) return
    initialized = true
    refresh()
    refreshCustomers()
    refreshComms()
  }, [])

  // Filtered + paged data
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return prospects.filter((p) => {
      if (targetFilter !== 'all' && p.targetType !== targetFilter) return false
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false
      if (!q) return true
      return [p.name, p.company, p.location, p.industry, p.companySize, p.email ?? '', p.phone ?? '', p.notes, p.leadSource]
        .join(' ').toLowerCase().includes(q)
    })
  }, [prospects, search, targetFilter, stageFilter])

  const grouped = useMemo(() => {
    const map: Record<OutreachStage, OutreachProspect[]> = {
      New: [], Contacted: [], Responded: [], Qualified: [], Partner: [], Archived: [],
    }
    filtered.forEach((p) => map[p.stage].push(p))
    return map
  }, [filtered])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pageIndex, pagination.pageSize])

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (paged.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paged.map((p) => p.id)))
    }
  }

  const handleClearSelection = () => setSelectedIds(new Set())

  // Bulk actions
  const handleBulkMoveStage = async (stage: OutreachStage) => {
    const ids = Array.from(selectedIds)
    await bulkUpdate(ids, { stage })
    toast.success(`Moved ${ids.length} prospect${ids.length !== 1 ? 's' : ''} to ${stage}.`)
    setSelectedIds(new Set())
  }
  
  // Future bulk actions also use bulkUpdate:
  const handleBulkChangeTargetType = async (targetType: OutreachTargetType) => {
    const ids = Array.from(selectedIds)
    await bulkUpdate(ids, { targetType })
    toast.success(`Updated target type for ${ids.length} prospect${ids.length !== 1 ? 's' : ''}.`)
    setSelectedIds(new Set())
  }
  
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    await bulkDelete(ids)
    toast.success(`Deleted ${ids.length} prospect${ids.length !== 1 ? 's' : ''}.`)
    setSelectedIds(new Set())
  }

  const handleBulkSendMessage = () => {
    const first = prospects.find((p) => selectedIds.has(p.id))
    if (first) {
      setMessagingProspect(first)
      setMessageOpen(true)
    }
  }

  const handleSendMessage = (p: OutreachProspect) => {
    setMessagingProspect(p)
    setMessageOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Generation & Outreach</h1>
          <p className="text-muted-foreground text-sm">
            Track alliance prospects through an outreach pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setFindLeadsOpen(true)}>
            <Search className="mr-2 size-4" />
            Find Leads
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <IconPlus className="mr-2 size-4" />
            New prospect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <OutreachFilters
        search={search}
        onSearchChange={setSearch}
        targetFilter={targetFilter}
        onTargetFilterChange={setTargetFilter}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        total={prospects.length}
      />

      {/* Stats */}
      <OutreachStats
        total={prospects.length}
        contacted={grouped.Contacted.length}
        qualified={grouped.Qualified.length}
        partners={grouped.Partner.length}
      />

      {/* Prospects Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prospects table</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Bulk toolbar */}
          <OutreachBulkToolbar
            selectedCount={selectedIds.size}
            onClearSelection={handleClearSelection}
            onSendMessage={handleBulkSendMessage}
            onMoveToStage={handleBulkMoveStage}
            onDeleteSelected={handleBulkDelete}
          />

          <OutreachTable
            paged={paged}
            filtered={filtered}
            selectedIds={selectedIds}
            pageIndex={pageIndex}
            pageCount={pageCount}
            pageSize={pagination.pageSize}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onView={(p) => { setViewing(p); setViewOpen(true) }}
            onEdit={(p) => { setEditing(p); setFormOpen(true) }}
            onSendMessage={handleSendMessage}
            onMoveStage={(id, stage) => moveProspectStage(id, stage)}
            onDelete={(id) => deleteProspect(id)}
            onPageChange={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
            onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProspectFormDialog open={formOpen} onOpenChange={setFormOpen} prospect={editing} />
      <ProspectViewDialog open={viewOpen} onOpenChange={setViewOpen} prospect={viewing} />
      <ProspectSendMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        prospect={messagingProspect}
        onSent={() => {
          setSelectedIds(new Set())
          refresh()
        }}
      />
      <FindLeadsDialog open={findLeadsOpen} onOpenChange={setFindLeadsOpen} />
    </div>
  )
}