'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'google'
export type PostStatus = 'draft' | 'scheduled' | 'posted'

export interface SocialPost {
  id: string
  profileId: string
  platform: Platform
  content: string
  hashtags: string[]
  status: PostStatus
  scheduledDate: string   // yyyy-MM-dd
  scheduledTime?: string  // HH:mm
  createdAt: string
  updatedAt: string
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function mapPost(row: Record<string, unknown>): SocialPost {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    platform: row.platform as Platform,
    content: row.content as string,
    hashtags: (row.hashtags as string[]) ?? [],
    status: row.status as PostStatus,
    scheduledDate: row.scheduled_date as string,
    scheduledTime: (row.scheduled_time as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('profile_id', user.id)
    .order('scheduled_date', { ascending: true })
  return (data ?? []).map(mapPost)
}

export async function createSocialPost(input: {
  platform: Platform
  content: string
  hashtags?: string[]
  status: PostStatus
  scheduledDate: string
  scheduledTime?: string
}): Promise<{ data?: SocialPost; error?: string }> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      profile_id: user.id,
      platform: input.platform,
      content: input.content,
      hashtags: input.hashtags ?? [],
      status: input.status,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime ?? null,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing')
  return { data: mapPost(data) }
}

export async function updateSocialPost(
  id: string,
  input: Partial<{
    platform: Platform
    content: string
    hashtags: string[]
    status: PostStatus
    scheduledDate: string
    scheduledTime: string | null
  }>
): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('social_posts')
    .update({
      platform: input.platform,
      content: input.content,
      hashtags: input.hashtags,
      status: input.status,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing')
  return { success: true }
}

export async function deleteSocialPost(id: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await getUser()
  const { error } = await supabase.from('social_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing')
  return { success: true }
}