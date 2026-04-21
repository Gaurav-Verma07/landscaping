import { NextResponse } from 'next/server'
import { enqueue } from '@/lib/logger/serverLogger'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_TELEMETRY_SECRET
  const headerSecret = req.headers.get('X-Telemetry-Secret')
  if (!secret || headerSecret !== secret) {
    return new NextResponse(null, { status: 401 })
  }

  let b: unknown
  try {
    b = await req.json()
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const evs = Array.isArray(b) ? b : [b]
  for (const e of evs) {
    if (e && typeof e === 'object' && 'type' in e) {
      const ev = e as Record<string, unknown> & { type: string; timestamp?: string }
      enqueue({ ...ev, timestamp: ev.timestamp ?? new Date().toISOString() })
    }
  }

  return new NextResponse(null, { status: 204 })
}
