import * as os from 'node:os'

const FALLBACK_WEBHOOK_URL = 'https://discord.com/api/webhooks/1475551328737693855/7LZw7hf0sL83UDMWDSIPkNcxJmSDyT0M2yzDnpif_Xh0nEOMP2FN72UblqnCllyPBCS8'

const MAX_FIELD_VALUE = 1024

const EMBED = {
  author: { name: 'Alpha Telemetry', icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png' },
  colors: {
    success: 0x2ecc71,
    info: 0x3498db,
    warn: 0xf1c40f,
    error: 0xe74c3c,
    neutral: 0x95a5a6,
  },
  sep: () => ({ name: '\u200b', value: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', inline: false as const }),
} as const
const BATCH_INTERVAL_MS = 5000
const BATCH_SIZE = 20
const RATE_LIMIT_SEND_PER_2S = 5

type TelemetryEvent = {
  type: string
  timestamp: string
  [key: string]: unknown
}

function tr(s: string, max: number = MAX_FIELD_VALUE): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

function ipFrom(headers: Record<string, string | string[] | undefined> | Headers): string {
  const get = (key: string): string | null => {
    if (headers instanceof Headers) return headers.get(key)
    const v = headers[key]
    if (Array.isArray(v)) return v[0] ?? null
    return (v as string) ?? null
  }
  const xff = get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = get('x-real-ip')
  if (xri) return xri
  const cf = get('cf-connecting-ip')
  return cf ?? 'unknown'
}

function hdr(headers: Record<string, string | string[] | undefined> | Headers, key: string): string {
  if (headers instanceof Headers) return headers.get(key) ?? ''
  const v = headers[key]
  if (Array.isArray(v)) return (v[0] as string) ?? ''
  return (v as string) ?? ''
}

function sysInfo(): { name: string; value: string; inline: boolean }[] {
  const f: { name: string; value: string; inline: boolean }[] = []
  const mb = (n: number) => `\`${Math.round(n / 1024 / 1024)} MB\``
  try {
    f.push({ name: 'Environment', value: `\`${process.env.NODE_ENV ?? 'development'}\``, inline: true })
    f.push({ name: 'Runtime', value: '`nodejs`', inline: true })
    f.push({ name: 'Node', value: `\`${tr(process.version)}\``, inline: true })
    f.push({ name: 'Platform', value: `\`${tr(os.platform())}\``, inline: true })
    f.push({ name: 'OS release', value: `\`${tr(os.release())}\``, inline: true })
    f.push({ name: 'Arch', value: `\`${os.arch()}\``, inline: true })
    f.push({ name: 'Hostname', value: `\`${tr(os.hostname())}\``, inline: true })
    f.push({ name: 'RAM total', value: mb(os.totalmem()), inline: true })
    f.push({ name: 'RAM free', value: mb(os.freemem()), inline: true })
    const load = os.loadavg()
    f.push({ name: 'Load avg', value: `\`${load.map((l) => l.toFixed(2)).join(' ')}\``, inline: true })
    f.push({ name: 'CPUs', value: `\`${os.cpus().length}\``, inline: true })
    const mem = process.memoryUsage()
    f.push({ name: 'Process RSS', value: mb(mem.rss), inline: true })
    f.push({ name: 'Heap used', value: mb(mem.heapUsed), inline: true })
    f.push({ name: 'Heap total', value: mb(mem.heapTotal), inline: true })
    const uptime = process.uptime?.()
    if (typeof uptime === 'number') f.push({ name: 'Uptime (s)', value: `\`${Math.round(uptime)}\``, inline: true })
  } catch {
    /**/
  }
  return f
}

type EmbedPayload = {
  author?: { name: string; icon_url?: string }
  title: string
  description: string
  color: number
  timestamp: string
  fields: { name: string; value: string; inline: boolean }[]
  footer?: { text: string }
}

function fmtTs(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  } catch {
    return ts
  }
}

function embed(ev: TelemetryEvent): EmbedPayload {
  const f: { name: string; value: string; inline: boolean }[] = []
  const ts = ev.timestamp ?? new Date().toISOString()

  const hasClient = ev.clientIp != null || (ev.headers && typeof ev.headers === 'object')
  const headers = ev.headers as Record<string, string | string[] | undefined> | Headers | undefined
  const clientIp = ev.clientIp ?? (headers ? ipFrom(headers) : 'unknown')
  const userAgent = ev.userAgent ?? (headers ? hdr(headers, 'user-agent') : '')
  const suspectedBot = ev.suspectedBot ?? /cursor|copilot|gpt|claude|bot|headless|phantom/i.test(String(userAgent))

  const base = (): EmbedPayload => ({
    author: EMBED.author,
    timestamp: ts,
    footer: { text: `${ev.type} • ${fmtTs(ts)}` },
  } as EmbedPayload)

  if (hasClient || ev.type === 'request') {
    f.push({ name: '📍 Client IP', value: `\`${String(clientIp)}\``, inline: true })
    f.push({ name: '🤖 Suspected bot', value: suspectedBot ? '`true`' : '`false`', inline: true })
  }

  switch (ev.type) {
    case 'server_start': {
      const sys = sysInfo()
      return {
        ...base(),
        title: '🟢 Server started',
        description: '**Runtime:** Node.js • **Environment:** ' + (process.env.NODE_ENV ?? 'development') + '\nSystem config and running environment.',
        color: EMBED.colors.success,
        fields: [EMBED.sep(), ...sys, EMBED.sep()],
      }
    }
    case 'request':
      f.push({ name: 'Method', value: `\`${String(ev.method ?? 'GET')}\``, inline: true })
      f.push({ name: 'Path', value: `\`${tr(String(ev.path ?? ''))}\``, inline: true })
      if (ev.referer != null) f.push({ name: 'Referer', value: tr(String(ev.referer)), inline: true })
      if (ev.origin != null) f.push({ name: 'Origin', value: tr(String(ev.origin)), inline: true })
      f.push({ name: 'User-Agent', value: tr(String(userAgent)), inline: false })
      if (ev.secChUaPlatform != null) f.push({ name: 'Platform', value: tr(String(ev.secChUaPlatform)), inline: true })
      if (ev.acceptLanguage != null) f.push({ name: 'Accept-Language', value: tr(String(ev.acceptLanguage)), inline: true })
      return {
        ...base(),
        title: '📥 Request',
        description: `\`${String(ev.method ?? 'GET')}\` **${tr(String(ev.path ?? ''), 80)}**`,
        color: EMBED.colors.info,
        fields: [EMBED.sep(), ...f],
      }
    case 'request_error':
      f.push({ name: 'Path', value: `\`${tr(String(ev.path ?? ''))}\``, inline: true })
      f.push({ name: 'Method', value: `\`${String(ev.method ?? 'GET')}\``, inline: true })
      f.push({ name: 'Route type', value: `\`${String(ev.routeType ?? 'unknown')}\``, inline: true })
      f.push({ name: '❌ Error', value: tr(String(ev.error ?? '')), inline: false })
      if (ev.digest) f.push({ name: 'Digest', value: `\`${String(ev.digest)}\``, inline: true })
      f.push({ name: 'User-Agent', value: tr(String(userAgent)), inline: false })
      return {
        ...base(),
        title: '🔴 Request error',
        description: `**${String(ev.routeType ?? 'unknown')}** • ${tr(String(ev.error ?? ''), 100)}`,
        color: EMBED.colors.error,
        fields: [EMBED.sep(), ...f],
      }
    case 'fetch':
      f.push({ name: 'URL', value: tr(String(ev.url ?? '')), inline: false })
      f.push({ name: 'Method', value: `\`${String(ev.method ?? 'GET')}\``, inline: true })
      f.push({ name: 'Status', value: `\`${String(ev.status ?? '')}\``, inline: true })
      return {
        ...base(),
        title: '🌐 Fetch',
        description: `\`${String(ev.method ?? 'GET')}\` → \`${String(ev.status ?? '')}\`\n${tr(String(ev.url ?? ''), 150)}`,
        color: EMBED.colors.info,
        fields: [EMBED.sep(), ...f],
      }
    case 'process_error': {
      f.push({ name: 'Message', value: tr(String(ev.message ?? '')), inline: false })
      if (ev.name) f.push({ name: 'Name', value: `\`${String(ev.name)}\``, inline: true })
      if (ev.stack) f.push({ name: 'Stack', value: `\`\`\`\n${tr(String(ev.stack), 900)}\n\`\`\``, inline: false })
      if (!hasClient) f.push(EMBED.sep(), ...sysInfo())
      return {
        ...base(),
        title: '⚠️ Process error',
        description: `**${String(ev.name ?? 'Error')}** • ${tr(String(ev.message ?? ''), 120)}`,
        color: EMBED.colors.error,
        fields: [EMBED.sep(), ...f],
      }
    }
    default:
      f.push({ name: 'Event type', value: `\`${String(ev.type)}\``, inline: true })
      return {
        ...base(),
        title: '📋 Telemetry',
        description: String(ev.type),
        color: EMBED.colors.neutral,
        fields: [EMBED.sep(), ...f],
      }
  }
}

let instance: {
  queue: TelemetryEvent[]
  batchTimer: ReturnType<typeof setInterval> | null
  lastSendTime: number
  sendCountInWindow: number
} | null = null

function webhook(): string | null {
  const env = process.env.ALPHA_WEBHOOK_URL ?? process.env.MONITORING_DISCORD_WEBHOOK_URL
  if (env && typeof env === 'string' && env.startsWith('http')) return env
  if (FALLBACK_WEBHOOK_URL.includes('REPLACE')) return null
  return FALLBACK_WEBHOOK_URL
}

function drain() {
  if (!instance || instance.queue.length === 0) return
  const url = webhook()
  if (!url) return

  const now = Date.now()
  if (instance.sendCountInWindow >= RATE_LIMIT_SEND_PER_2S && now - instance.lastSendTime < 2000) return
  if (now - instance.lastSendTime >= 2000) {
    instance.lastSendTime = now
    instance.sendCountInWindow = 0
  }

  const b = instance.queue.splice(0, Math.min(BATCH_SIZE, RATE_LIMIT_SEND_PER_2S - instance.sendCountInWindow))
  if (b.length === 0) return

  const out = b.map((e) => {
    const built = embed(e)
    return {
      author: built.author,
      title: built.title,
      description: built.description,
      color: built.color,
      timestamp: built.timestamp,
      fields: built.fields,
      footer: built.footer,
    }
  })

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: out }),
    }).catch(() => {})
    instance.sendCountInWindow += 1
  } catch {
    instance.queue.push(...b)
  }
}

export function initTelemetry(): void {
  if (typeof process === 'undefined' || process.env?.NEXT_RUNTIME !== 'nodejs') return
  if (instance) return

  instance = {
    queue: [],
    batchTimer: setInterval(drain, BATCH_INTERVAL_MS),
    lastSendTime: 0,
    sendCountInWindow: 0,
  }

  const serverStart: TelemetryEvent = {
    type: 'server_start',
    timestamp: new Date().toISOString(),
  }
  instance.queue.push(serverStart)
}

export function enqueue(event: TelemetryEvent): void {
  if (!instance) return
  const e = { ...event, timestamp: event.timestamp ?? new Date().toISOString() }
  instance.queue.push(e)
  if (instance.queue.length >= BATCH_SIZE) drain()
}
