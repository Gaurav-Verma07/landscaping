'use client'

import { useState } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  searchCompaniesHouse,
  type CompaniesHouseResult,
  type UnifiedLead,
} from '@/lib/actions/lead-generation'
import { mapCompaniesHouseToUnified } from '@/lib/actions/lead-generation-mappers'

interface CompaniesHouseSearchProps {
  selectedIds: Set<string>
  onToggle: (lead: UnifiedLead) => void
  onSelectAll: (leads: UnifiedLead[]) => void
  onClearAll: () => void
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50]

export function CompaniesHouseSearch({
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: CompaniesHouseSearchProps) {
  const [query, setQuery] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [results, setResults] = useState<CompaniesHouseResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    const result = await searchCompaniesHouse(query.trim(), itemsPerPage)
    if (result.error) {
      setError(result.error)
      setResults([])
    } else {
      setResults(result.data?.items ?? [])
      setTotalResults(result.data?.total_results ?? 0)
    }
    setLoading(false)
  }

  const allSelected = results.length > 0 && results.every((r) => selectedIds.has(r.company_number))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field>
            <FieldLabel>Search keyword</FieldLabel>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. property management, landscaping..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
          </Field>
        </div>
        <Field>
          <FieldLabel>Results per page</FieldLabel>
          <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {searched && !loading && !error && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalResults} results found — showing {results.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"
                onClick={() => onSelectAll(results.map(mapCompaniesHouseToUnified))}
                disabled={allSelected}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={onClearAll} disabled={selectedIds.size === 0}>
                Clear
              </Button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              No companies found. Try a different keyword.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {results.map((result) => {
                const isSelected = selectedIds.has(result.company_number)
                return (
                  <div
                    key={result.company_number}
                    onClick={() => onToggle(mapCompaniesHouseToUnified(result))}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(mapCompaniesHouseToUnified(result))}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        <Badge
                          variant={result.company_status === 'active' ? 'default' : 'secondary'}
                          className="text-xs shrink-0"
                        >
                          {result.company_status}
                        </Badge>
                      </div>
                      {result.address_snippet && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {result.address_snippet}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{result.company_type}</Badge>
                        {result.sic_codes?.slice(0, 2).map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">SIC {code}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching Companies House...</span>
        </div>
      )}
    </div>
  )
}