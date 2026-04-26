'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuditEntry, AuditAction } from '@/lib/audit-types'

const MAX_ENTRIES = 500

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .eq('profile_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(MAX_ENTRIES)
  return (data ?? []).map(mapEntry)
}

export async function logAudit(
  action: AuditAction,
  entityType: AuditEntry['entityType'],
  entityId: string,
  details = ''
) {
  const { supabase, user } = await getUser()
  if (!user) return
  await supabase.from('audit_log').insert({
    profile_id: user.id,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
}

export async function clearAuditLog() {
  const { supabase, user } = await getUser()
  if (!user) return
  await supabase.from('audit_log').delete().eq('profile_id', user.id)
}

function mapEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    timestamp: row.timestamp as string,
    action: row.action as AuditAction,
    entityType: row.entity_type as AuditEntry['entityType'],
    entityId: row.entity_id as string,
    details: (row.details as string) ?? '',
    userId: (row.user_id as string) ?? undefined,
  }
}