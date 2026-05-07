// app/api/gps/verify/route.ts
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, haversineMeters } from '../../../../../utils/geo'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lat, lng, projectId } = body as {
      lat: number
      lng: number
      projectId: string
    }

    if (!lat || !lng || !projectId) {
      return Response.json(
        { error: 'lat, lng and projectId are required' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    // ── 1. Fetch project (only columns we need, no join) ──────────────────────
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, site_lat, site_lng, gps_radius_meters, customer_id')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('[gps/verify] project fetch error:', projectError)
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    let siteLat: number | null = project.site_lat ?? null
    let siteLng: number | null = project.site_lng ?? null
    const radius: number = project.gps_radius_meters ?? 200

    // ── 2. Auto-geocode from customer address if no site coords saved yet ─────
    if ((!siteLat || !siteLng) && project.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('addresses')
        .eq('id', project.customer_id)
        .single()

      if (!customerError && (customer?.addresses as string[] | null)?.length) {
        const address = (customer.addresses as string[])[0]
        const coords = await geocodeAddress(address)

        if (coords) {
          siteLat = coords.lat
          siteLng = coords.lng

          // Persist — never geocode this project again
          await supabase
            .from('projects')
            .update({ site_lat: siteLat, site_lng: siteLng })
            .eq('id', projectId)
        }
      }
    }

    // ── 3. Still no coords — allow clock-in but flag it ──────────────────────
    if (!siteLat || !siteLng) {
      return Response.json({
        verified: true,
        distance: null,
        radius,
        reason: 'no_site_coords',
      })
    }

    // ── 4. Haversine distance check ───────────────────────────────────────────
    const distance = Math.round(haversineMeters(lat, lng, siteLat, siteLng))
    const verified = distance <= radius

    return Response.json({ verified, distance, radius })
  } catch (err) {
    console.error('[gps/verify] unhandled error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}