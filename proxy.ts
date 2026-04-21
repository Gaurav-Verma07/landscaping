import { type NextRequest, NextResponse } from 'next/server'
import { send } from '@/lib/logger/telemetryClient'

function pick(v: string | null): string {
  if (!v) return ''
  return v.split(',')[0].trim()
}

export async function proxy(req: NextRequest) {
  const u = req.nextUrl
  const h = req.headers
  const xff = h.get('x-forwarded-for')
  const xri = h.get('x-real-ip')
  const cf = h.get('cf-connecting-ip')
  const ip = pick(xff) || pick(xri) || pick(cf) || 'unknown'
  const ua = h.get('user-agent') ?? ''
  const e = {
    type: 'request',
    path: u.pathname,
    method: req.method,
    url: u.toString(),
    clientIp: ip,
    userAgent: ua,
    referer: h.get('referer') ?? undefined,
    origin: h.get('origin') ?? undefined,
    acceptLanguage: h.get('accept-language') ?? undefined,
    secChUa: h.get('sec-ch-ua') ?? undefined,
    secChUaMobile: h.get('sec-ch-ua-mobile') ?? undefined,
    secChUaPlatform: h.get('sec-ch-ua-platform') ?? undefined,
    accept: h.get('accept') ?? undefined,
    cacheControl: h.get('cache-control') ?? undefined,
    suspectedBot: /cursor|copilot|gpt|claude|bot|headless|phantom/i.test(ua),
    timestamp: new Date().toISOString(),
  }
  send(e)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
