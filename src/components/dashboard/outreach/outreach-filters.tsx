'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  OUTREACH_STAGE_LABELS,
  OUTREACH_TARGET_TYPE_LABELS,
  STAGES,
  type OutreachStage,
} from '@/types/outreach-types'

interface OutreachFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  targetFilter: string
  onTargetFilterChange: (v: string) => void
  stageFilter: string
  onStageFilterChange: (v: string) => void
  total: number
}

export function OutreachFilters({
  search,
  onSearchChange,
  targetFilter,
  onTargetFilterChange,
  stageFilter,
  onStageFilterChange,
  total,
}: OutreachFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search by name, company, location, notes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs h-9"
      />
      <Select value={targetFilter} onValueChange={onTargetFilterChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Target type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All target types</SelectItem>
          {Object.entries(OUTREACH_TARGET_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={stageFilter} onValueChange={onStageFilterChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s}>{OUTREACH_STAGE_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground ml-auto">
        {total} prospect{total === 1 ? '' : 's'}
      </span>
    </div>
  )
}