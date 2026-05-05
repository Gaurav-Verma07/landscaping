import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/provider.factory'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { executeConfirmedAction } from '@/lib/ai/tool-executor'
import { allTools } from '@/lib/ai/tools'
import type { AIMessage, AIStreamChunk } from '@/lib/ai/provider.interface'
import type { PendingAction } from '@/lib/ai/tool-executor'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatRequest {
  messages: AIMessage[]
  confirmedAction?: PendingAction
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Parse ───────────────────────────────────────────────────────────────
  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, confirmedAction } = body

  // ── 3. Confirmed action ────────────────────────────────────────────────────
  if (confirmedAction) {
    const result = await executeConfirmedAction(confirmedAction)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 4. Profile only — no data preloading ───────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, team_name')
    .eq('id', user.id)
    .single()

  const systemPrompt = buildSystemPrompt({
    companyName: profile?.team_name ?? null,
    userName: profile?.full_name ?? user.email ?? null,
    userRole: profile?.role ?? 'owner',
    currentDateTime: new Date().toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    }),
  })

  // ── 5. Stream ──────────────────────────────────────────────────────────────
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: AIStreamChunk) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      try {
        const provider = getAIProvider()
        await provider.chat({
          systemPrompt,
          messages,
          tools: allTools,
          onChunk: send,
        })
      } catch (err) {
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'AI request failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}