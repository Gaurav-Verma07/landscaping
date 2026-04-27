import type { CompaniesHouseResult, OverpassElement, UnifiedLead } from './lead-generation'

export function mapCompaniesHouseToUnified(r: CompaniesHouseResult): UnifiedLead {
  return {
    source_id: r.company_number,
    source: 'companies_house',
    name: r.title,
    address_line_1: r.address?.address_line_1,
    city: r.address?.locality,
    postcode: r.address?.postal_code,
    country: r.address?.country,
    business_type: r.company_type,
    status: r.company_status,
    raw_address: r.address_snippet,
    description: r.description,
  }
}

export function mapOverpassToUnified(e: OverpassElement): UnifiedLead {
  const tags = e.tags ?? {}
  return {
    source_id: String(e.id),
    source: 'openstreetmap',
    name: tags.name ?? '',
    phone: tags.phone,
    email: tags.email,
    website: tags.website,
    address_line_1: tags['addr:street'],
    city: tags['addr:city'],
    postcode: tags['addr:postcode'],
    country: tags['addr:country'],
    business_type: tags.amenity || tags.shop,
  }
}

export function getCategories(keyword: string): string {
  const k = keyword.toLowerCase()
  if (k.includes('garden') || k.includes('landscape')) return 'commercial.garden_centre,service.construction.garden'
  if (k.includes('property') || k.includes('estate')) return 'commercial.real_estate'
  if (k.includes('hotel') || k.includes('hospitality')) return 'accommodation.hotel'
  if (k.includes('contractor') || k.includes('construction')) return 'service.construction'
  return 'commercial,service'
}
