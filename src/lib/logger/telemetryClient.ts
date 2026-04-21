const INTERNAL_URL = '/api/internal/telemetry'

export function send(ev: Record<string, unknown>): void {
  const secret = process.env.INTERNAL_TELEMETRY_SECRET
  if (!secret) return

  fetch(INTERNAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telemetry-Secret': secret,
    },
    body: JSON.stringify(ev),
  }).catch(() => {})
}
