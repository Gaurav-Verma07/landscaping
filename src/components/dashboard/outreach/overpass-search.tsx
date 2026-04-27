'use client'

import { useState } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
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
  searchOverpass,
  type OverpassElement,
  type UnifiedLead,
} from '@/lib/actions/lead-generation'
import { mapOverpassToUnified } from '@/lib/actions/lead-generation-mappers'

interface OverpassSearchProps {
  selectedIds: Set<string>
  onToggle: (lead: UnifiedLead) => void
  onSelectAll: (leads: UnifiedLead[]) => void
  onClearAll: () => void
}

const AMENITY_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'garden_centre', label: 'Garden centre' },
  { value: 'estate_agent', label: 'Estate agent' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'company', label: 'Company' },
]

const LIMIT_OPTIONS = [10, 20, 50]

export function OverpassSearch({
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: OverpassSearchProps) {
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [amenityType, setAmenityType] = useState('all')
  const [limit, setLimit] = useState(20)
  const [results, setResults] = useState<OverpassElement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!keyword.trim() && !city.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)

    const result = await searchOverpass(keyword, city, amenityType, limit)

    if (result.error) {
      setError(result.error)
      setResults([])
    } else {
      setResults(result.data ?? [])
    }
    setLoading(false)
  }

  const allSelected =
    results.length > 0 && results.every((r) => selectedIds.has(String(r.id)))

  const formatAddress = (tags: OverpassElement['tags']) => {
    if (!tags) return ''
    return [tags['addr:street'], tags['addr:city'], tags['addr:postcode']]
      .filter(Boolean)
      .join(', ')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Keyword / business name</FieldLabel>
          <Input
            placeholder="e.g. landscaping, property..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </Field>
        <Field>
          <FieldLabel>City / town</FieldLabel>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. London, Manchester..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || (!keyword.trim() && !city.trim())}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>
        </Field>
      </div>

      <div className="flex gap-3">
        <Field>
          <FieldLabel>Business type</FieldLabel>
          <Select value={amenityType} onValueChange={setAmenityType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AMENITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Max results</FieldLabel>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((n) => (
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
              {results.length} results found
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectAll(results.map(mapOverpassToUnified))}
                disabled={allSelected}
              >
                Select all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                disabled={selectedIds.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              No businesses found. Try a different keyword or city.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {results.map((element) => {
                const isSelected = selectedIds.has(String(element.id))
                const address = formatAddress(element.tags)
                const type = element.tags?.amenity || element.tags?.shop

                return (
                  <div
                    key={element.id}
                    onClick={() => onToggle(mapOverpassToUnified(element))}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(mapOverpassToUnified(element))}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{element.tags?.name}</span>
                      </div>
                      {address && (
                        <p className="text-xs text-muted-foreground">{address}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {type && (
                          <Badge variant="outline" className="text-xs">{type}</Badge>
                        )}
                        {element.tags?.phone && (
                          <Badge variant="outline" className="text-xs">
                            {element.tags.phone}
                          </Badge>
                        )}
                        {element.tags?.website && (
                          <Badge variant="outline" className="text-xs truncate max-w-[200px]">
                            {element.tags.website}
                          </Badge>
                        )}
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
          <span className="ml-2 text-sm text-muted-foreground">
            Searching OpenStreetMap...
          </span>
        </div>
      )}
    </div>
  )
}