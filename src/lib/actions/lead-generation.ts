'use server'

import { getCategories } from "./lead-generation-mappers"

const BASE_URL = 'https://api.company-information.service.gov.uk'

// ============================================
// COMPANIES HOUSE
// ============================================

export interface CompaniesHouseResult {
  company_number: string
  title: string
  company_type: string
  company_status: string
  date_of_creation: string
  address?: {
    premises?: string
    address_line_1?: string
    address_line_2?: string
    locality?: string
    postal_code?: string
    region?: string
    country?: string
  }
  address_snippet?: string
  description?: string
  sic_codes?: string[]
}

export interface CompaniesHouseSearchResponse {
  items: CompaniesHouseResult[]
  total_results: number
  items_per_page: number
}

export async function searchCompaniesHouse(
  query: string,
  itemsPerPage = 20
): Promise<{ data?: CompaniesHouseSearchResponse; error?: string }> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY
  if (!apiKey) return { error: 'Companies House API key not configured.' }
  if (!query.trim()) return { error: 'Search query is required.' }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      items_per_page: String(itemsPerPage),
    })

    const response = await fetch(`${BASE_URL}/search/companies?${params}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) return { error: 'Invalid API key.' }
      if (response.status === 429) return { error: 'Rate limit exceeded. Try again later.' }
      return { error: `API error: ${response.status}` }
    }

    const data: CompaniesHouseSearchResponse = await response.json()
    return { data }
  } catch {
    return { error: 'Failed to connect to Companies House API.' }
  }
}

// ============================================
// OVERPASS (OPENSTREETMAP)
// ============================================

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  tags?: {
    name?: string
    amenity?: string
    shop?: string
    phone?: string
    email?: string
    website?: string
    'addr:street'?: string
    'addr:city'?: string
    'addr:postcode'?: string
    'addr:country'?: string
    opening_hours?: string
    [key: string]: string | undefined
  }
}

export interface OverpassResult {
  elements: OverpassElement[]
}

export async function searchOverpass(
  keyword: string,
  city: string,
  amenityType = 'all',
  limit = 20
): Promise<{ data?: OverpassElement[]; error?: string }> {
  if (!keyword.trim() && !city.trim()) return { error: 'Enter a keyword or city.' }

  const amenityFilter = amenityType !== 'all' ? `["amenity"="${amenityType}"]` : ''
  const nameFilter = keyword.trim() ? `["name"~"${keyword.trim()}",i]` : ''

  const query = `
    [out:json][timeout:30];
    area["name"="${city.trim()}"]["place"~"city|town"]->.searchArea;
    nwr["name"]${nameFilter}${amenityFilter}(area.searchArea);
    out center ${limit};
  `

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(35000),
      })

      if (!response.ok) continue

      const text = await response.text()
      if (text.includes('<html') || text.includes('Error')) continue

      const data: OverpassResult = JSON.parse(text)
      const filtered = (data.elements ?? []).filter(
        (e) => e.tags?.name && e.tags.name.trim() !== ''
      )
      return { data: filtered }
    } catch {
      continue
    }
  }

  return { error: 'OpenStreetMap servers are busy. Try again in a moment.' }
}
// ============================================
// UNIFIED LEAD SCHEMA
// ============================================

export interface UnifiedLead {
  source_id: string
  source: 'companies_house' | 'openstreetmap'
  name: string
  phone?: string
  email?: string
  website?: string
  address_line_1?: string
  city?: string
  postcode?: string
  country?: string
  business_type?: string
  status?: string
  raw_address?: string
  description?: string
}

// ============================================
// GEOAPIFY
// ============================================

export interface GeoapifyFeature {
  properties: {
    place_id: string
    name?: string
    address_line1?: string
    address_line2?: string
    city?: string
    postcode?: string
    country?: string
    country_code?: string
    phone?: string
    website?: string
    email?: string
    categories?: string[]
    datasource?: {
      raw?: {
        phone?: string
        website?: string
        email?: string
        opening_hours?: string
      }
    }
  }
}

export interface GeoapifyResponse {
  features: GeoapifyFeature[]
}

export async function searchGeoapify(
  keyword: string,
  city: string,
  limit = 20
): Promise<{ data?: UnifiedLead[]; error?: string }> {
  const apiKey = process.env.GEOAPIFY_API_KEY
  console.log('GEOAPIFY_API_KEY:', apiKey ? 'loaded' : 'missing')
  if (!apiKey) return { error: 'Geoapify API key not configured.' }

  try {
    const geocodeParams = new URLSearchParams({
      text: city.trim(),
      type: 'city',
      limit: '1',
      apiKey,
    })

    console.log('Geocoding:', `https://api.geoapify.com/v1/geocode/search?${geocodeParams}`)

    const geocodeRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?${geocodeParams}`
    )

    console.log('Geocode status:', geocodeRes.status)

    if (!geocodeRes.ok) return { error: `Geocode error: ${geocodeRes.status}` }

    const geocodeData = await geocodeRes.json()
    console.log('Geocode result:', JSON.stringify(geocodeData?.features?.[0]?.properties))

    const location = geocodeData.features?.[0]
    if (!location) return { error: `City "${city}" not found.` }

    const lon = location.properties.lon
    const lat = location.properties.lat

    const placesParams = new URLSearchParams({
      categories: "commercial.trade",
      filter: `circle:${lon},${lat},10000`,
      limit: String(limit),
      apiKey,
    })

    console.log('Categories:', getCategories(keyword))
    console.log('Places URL:', `https://api.geoapify.com/v2/places?${placesParams}`)

    const placesRes = await fetch(
      `https://api.geoapify.com/v2/places?${placesParams}`
    )

    console.log('Places status:', placesRes.status)
    const placesText = await placesRes.text()
    console.log('Places response:', placesText.slice(0, 500))

    if (!placesRes.ok) {
      if (placesRes.status === 401) return { error: 'Invalid Geoapify API key.' }
      if (placesRes.status === 429) return { error: 'Rate limit exceeded.' }
      return { error: `Places API error: ${placesRes.status}` }
    }

    const data: GeoapifyResponse = JSON.parse(placesText)
    const leads: UnifiedLead[] = (data.features ?? [])
      .filter((f) => f.properties.name)
      .map((f) => {
        const p = f.properties
        const raw = p.datasource?.raw ?? {}
        return {
          source_id: p.place_id,
          source: 'openstreetmap' as const,
          name: p.name ?? '',
          phone: p.phone || raw.phone,
          email: p.email || raw.email,
          website: p.website || raw.website,
          address_line_1: p.address_line1,
          city: p.city,
          postcode: p.postcode,
          country: p.country,
          business_type: p.categories?.[0],
          raw_address: [p.address_line1, p.city, p.postcode].filter(Boolean).join(', '),
        }
      })

    return { data: leads }
  } catch (err) {
    const cause = err instanceof Error ? (err as NodeJS.ErrnoException).cause : undefined
    console.error('Geoapify error:', err)
    console.error('Geoapify cause:', cause)          // ← this is the real error
    return {
      error: `Failed to connect to Geoapify: ${
        err instanceof Error ? err.message : String(err)
      } | cause: ${cause instanceof Error ? cause.message : String(cause)}`,
    }
  }
}