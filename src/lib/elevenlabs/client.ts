/** Client-side ElevenLabs fetch helpers. */

export async function fetchConversationToken(): Promise<string> {
  const res = await fetch('/api/elevenlabs/conversation-token')
  if (!res.ok) throw new Error('Failed to fetch conversation token')
  const d = await res.json()
  return d.token
}

export async function fetchSignedUrl(): Promise<string> {
  const res = await fetch('/api/elevenlabs/signed-url')
  if (!res.ok) throw new Error('Failed to fetch signed URL')
  const d = await res.json()
  return d.signedUrl
}

export function getAgentId(): string {
  const aid = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  if (!aid) {
    console.warn('NEXT_PUBLIC_ELEVENLABS_AGENT_ID not set. Use signed URLs/tokens in prod.')
    return ''
  }
  return aid
}
