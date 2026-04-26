export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { initTelemetry, enqueue } = await import('@/lib/logger/serverLogger')
  initTelemetry()

  const orig = globalThis.fetch
  globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const method = (init?.method ?? (typeof input !== 'string' && !(input instanceof URL) && 'method' in input ? (input as Request).method : undefined)) ?? 'GET'
    return orig.call(globalThis, input, init).then(
      (res) => {
        try {
          enqueue({ type: 'fetch', url: u, method, status: res.status, timestamp: new Date().toISOString() })
        } catch { /**/ }
        return res
      },
      (err) => {
        try {
          enqueue({ type: 'fetch', url: u, method, status: 0, error: err?.message, timestamp: new Date().toISOString() })
        } catch { /**/ }
        throw err
      }
    )
  }

  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('uncaughtException', (err) => {
      try {
        enqueue({ type: 'process_error', name: err?.name, message: err?.message, stack: err?.stack, timestamp: new Date().toISOString() })
      } catch { /**/ }
    })

    process.on('unhandledRejection', (reason) => {
      try {
        enqueue({ type: 'process_error', message: reason != null ? String(reason) : 'unhandledRejection', timestamp: new Date().toISOString() })
      } catch { /**/ }
    })

    process.on('warning', (warn) => {
      try {
        enqueue({ type: 'process_error', name: warn?.name ?? 'Warning', message: warn?.message ?? String(warn), timestamp: new Date().toISOString() })
      } catch { /**/ }
    })
  }
}

function one(h: Record<string, string | string[] | undefined>, key: string): string {
  const v = h[key]
  if (Array.isArray(v)) return (v[0] as string) ?? ''
  return (v as string) ?? ''
}

export async function onRequestError(
  err: Error & { digest?: string },
  req: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  ctx: { routeType?: string }
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { enqueue } = await import('@/lib/logger/serverLogger')
  const h = req.headers ?? {}
  const ip = one(h, 'x-forwarded-for') || one(h, 'x-real-ip') || 'unknown'
  const ua = one(h, 'user-agent')
  enqueue({
    type: 'request_error',
    error: err?.message,
    digest: err?.digest,
    path: req.path,
    method: req.method,
    routeType: ctx?.routeType,
    headers: req.headers,
    clientIp: ip,
    userAgent: ua,
    suspectedBot: /cursor|copilot|gpt|claude|bot|headless|phantom/i.test(ua),
    timestamp: new Date().toISOString(),
  })
}
