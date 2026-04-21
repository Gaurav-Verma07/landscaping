/** ElevenLabs server-only; use in API routes / server components. */

const BASE = 'https://api.elevenlabs.io/v1'

function k(): string {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('Missing ELEVENLABS_API_KEY')
  return key
}

function aid(): string {
  const bot = process.env.ELEVENLABS_AGENT_ID
  if (!bot) throw new Error('Missing ELEVENLABS_AGENT_ID')
  return bot
}

export async function getSignedUrl(): Promise<string> {
  const res = await fetch(
    `${BASE}/convai/conversation/get-signed-url?agent_id=${aid()}`,
    { headers: { 'xi-api-key': k() } }
  )
  if (!res.ok) throw new Error(`Signed URL failed: ${res.status} ${await res.text()}`)
  const b = await res.json()
  return b.signed_url
}

export async function getConversationToken(): Promise<string> {
  const res = await fetch(
    `${BASE}/convai/conversation/token?agent_id=${aid()}`,
    { headers: { 'xi-api-key': k() } }
  )
  if (!res.ok) throw new Error(`Token failed: ${res.status} ${await res.text()}`)
  const b = await res.json()
  return b.token
}

export async function getUserInfo() {
  const res = await fetch(`${BASE}/user`, { headers: { 'xi-api-key': k() } })
  if (!res.ok) throw new Error(`User info failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export interface ElevenLabsUserInfo {
  subscription: {
    tier: string
    character_count: number
    character_limit: number
    can_extend_character_limit: boolean
    next_character_count_reset_unix: number
  }
  xi_api_key?: string
  is_new_user: boolean
  can_use_delayed_payment_methods: boolean
}
