'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DocumentRecord, CreateDocumentData } from '@/lib/document-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getDocuments(): Promise<DocumentRecord[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapDocument)
}

export async function getDocumentsByCustomerId(customerId: string): Promise<DocumentRecord[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapDocument)
}

export async function getDocumentsByProjectId(projectId: string): Promise<DocumentRecord[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('profile_id', user.id)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapDocument)
}

export async function createDocument(data: CreateDocumentData) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: created, error } = await supabase
    .from('documents')
    .insert({
      profile_id: user.id,
      customer_id: data.customerId,
      project_id: data.projectId,
      name: data.name,
      file_url: data.fileUrl,
      type: data.type,
      tags: data.tags,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/documents')
  return { data: mapDocument(created) }
}

export async function uploadDocument(
  file: File,
  meta: Omit<CreateDocumentData, 'fileUrl'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/documents/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file)
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(path)

  return createDocument({ ...meta, fileUrl: publicUrl })
}

export async function updateDocument(id: string, data: Partial<CreateDocumentData>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('documents')
    .update({
      name: data.name,
      type: data.type,
      tags: data.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function deleteDocument(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/documents')
  return { success: true }
}

function mapDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: row.id as string,
    customerId: (row.customer_id as string) ?? null,
    projectId: (row.project_id as string) ?? null,
    name: row.name as string,
    fileUrl: (row.file_url as string) ?? '',
    type: row.type as DocumentRecord['type'],
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}