'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOutreachStore } from '@/lib/stores'
import { CompaniesHouseSearch } from './companies-house-search'
import { OverpassSearch } from './overpass-search'
import { GeoapifySearch } from './geoapify-search'
import { LeadImportPreview } from './lead-import-preview'
import type { UnifiedLead } from '@/lib/actions/lead-generation'
import {
  OUTREACH_TARGET_TYPE_LABELS,
  STAGES,
  type OutreachTargetType,
} from '@/types/outreach-types'

type Source = 'companies_house' | 'openstreetmap' | 'geoapify'

interface FindLeadsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildNotes(lead: UnifiedLead): string {
  const lines = [
    `Source: ${lead.source === 'companies_house' ? 'Companies House' : 'OpenStreetMap'}`,
  ]
  if (lead.source_id) lines.push(`ID: ${lead.source_id}`)
  if (lead.business_type) lines.push(`Type: ${lead.business_type}`)
  if (lead.status) lines.push(`Status: ${lead.status}`)
  if (lead.raw_address) lines.push(`Address: ${lead.raw_address}`)
  if (lead.website) lines.push(`Website: ${lead.website}`)
  if (lead.description) lines.push(`Description: ${lead.description}`)
  return lines.join('\n')
}

export function FindLeadsDialog({ open, onOpenChange }: FindLeadsDialogProps) {
  const { createProspects, prospects } = useOutreachStore()
  const [source, setSource] = useState<Source>('companies_house')
  const [targetType, setTargetType] = useState<OutreachTargetType>('Contractor')
  const [selected, setSelected] = useState<Map<string, UnifiedLead>>(new Map())
  const [importing, setImporting] = useState(false)

  const selectedArray = Array.from(selected.values())
  const existingNames = new Set(prospects.map((p) => p.company.toLowerCase().trim()))

  const handleToggle = (lead: UnifiedLead) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.has(lead.source_id) ? next.delete(lead.source_id) : next.set(lead.source_id, lead)
      return next
    })
  }

  const handleSelectAll = (leads: UnifiedLead[]) => {
    setSelected((prev) => {
      const next = new Map(prev)
      leads.forEach((l) => next.set(l.source_id, l))
      return next
    })
  }

  const handleClearAll = () => setSelected(new Map())

  const handleRemove = (id: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  const handleImport = async () => {
    if (selectedArray.length === 0) return
    setImporting(true)

    try {
      const inputs = selectedArray
        .filter((lead) => !existingNames.has(lead.name.toLowerCase().trim()))
        .map((lead) => ({
          name: '',
          company: lead.name,
          targetType,
          location: [lead.city, lead.postcode].filter(Boolean).join(', '),
          industry: lead.business_type ?? '',
          companySize: '',
          email: lead.email,
          phone: lead.phone,
          notes: buildNotes(lead),
          stage: STAGES[0],
          leadSource: lead.source,
        }))

      const skipped = selectedArray.length - inputs.length
      await createProspects(inputs)

      toast.success(
        `Imported ${inputs.length} lead${inputs.length !== 1 ? 's' : ''} as ${OUTREACH_TARGET_TYPE_LABELS[targetType]}.${
          skipped ? ` Skipped ${skipped} duplicate${skipped !== 1 ? 's' : ''}.` : ''
        }`
      )
      setSelected(new Map())
      onOpenChange(false)
    } catch {
      toast.error('Failed to import leads.')
    } finally {
      setImporting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelected(new Map())
      setImporting(false)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Find Leads</DialogTitle>
                <DialogDescription>
                  Search and import prospects. Duplicates are automatically skipped.
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Target Type</label>
                <Select
                  value={targetType}
                  onValueChange={(v) => setTargetType(v as OutreachTargetType)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Target type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OUTREACH_TARGET_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Source</label>
                <Select
                  value={source}
                  onValueChange={(v) => { setSource(v as Source); setSelected(new Map()) }}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="companies_house">🏢 Companies House</SelectItem>
                    <SelectItem value="openstreetmap">🗺️ OpenStreetMap</SelectItem>
                    <SelectItem value="geoapify">📍 Geoapify Places</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {source === 'companies_house' ? (
            <CompaniesHouseSearch
              selectedIds={new Set(selected.keys())}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />
          ) : source === 'openstreetmap' ? (
            <OverpassSearch
              selectedIds={new Set(selected.keys())}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />
          ) : (
            <GeoapifySearch
              selectedIds={new Set(selected.keys())}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />
          )}

          {selectedArray.length > 0 && (
            <>
              <Separator />
              <LeadImportPreview
                selected={selectedArray}
                targetType={OUTREACH_TARGET_TYPE_LABELS[targetType]}
                onRemove={handleRemove}
              />
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedArray.length === 0 || importing}
          >
            {importing
              ? 'Importing...'
              : `Import ${selectedArray.length > 0 ? selectedArray.length : ''} lead${selectedArray.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}