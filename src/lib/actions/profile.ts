'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadTeamLogo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `team-logos/${user.id}.${ext}`

  const { error } = await supabase.storage
    .from('team-logos')          // ← change to your bucket name
    .upload(path, file, { upsert: true })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from('team-logos')          // ← same bucket name
    .getPublicUrl(path)

  return { url: publicUrl }
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function upsertProfile(d: Partial<{
  email: string | null
  full_name: string | null
  avatar_url: string | null
  team_name: string | null
  team_logo_url: string | null
  company_phone: string | null
  company_email: string | null
  company_address: string | null
  invoice_prefix: string | null
  payment_terms_days: number
  warranty_blurb: string | null
  notify_email: boolean
  notify_sms: boolean
  voice_assistant_enabled: boolean
  voice_wake_word: string | null
  theme: string | null
  brand_color: string | null
  // SMTP email config
  smtp_host: string | null
  smtp_port: number | null
  smtp_email: string | null
  smtp_password: string | null
  smtp_from_name: string | null
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ ...d, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function uploadAvatar(formData: FormData){
  const supabase= await createClient()
  const {data: {user}}= await supabase.auth.getUser()
  if(!user)return {error:"Not authenticated"}

  const file= formData.get('file') as File
  if(!file) return {error : 'No file provided'}

  if(!file.type.startsWith('image/'))
    return {error: "File must be an image"}

  if(file.size> 5*1024*1024)
    return {error: "Image must be under 5MB"}

  const ext= file.name.split('.').pop() ?? 'png'
  const path= `avatars/${user.id}.${ext}`

  const {error: uploadError}= await supabase.storage
    .from('user-avatars')
    .upload(path, file, {upsert: true})

  if(uploadError) return {error: uploadError.message}

  const {data: {publicUrl}}= supabase.storage
    .from('user-avatars')
    .getPublicUrl(path)

  const url= `${publicUrl}?t=${Date.now()}`

  const {error: profileError}= await supabase
    .from('profiles')
    .update({avatar_url: url, updated_at: new Date().toISOString()})
    .eq('id', user.id)
  
  if(profileError)
    return {error: profileError.message}

  return {url}
}

export async function  removeAvatar(){
  const supabase= await createClient()
  const {data: {user}}= await supabase.auth.getUser()
  if(!user)
    return {error: "Not authenticated"}

  const extensions= ['png', 'jpg', 'jpeg', 'webp']
  await Promise.allSettled(
    extensions.map((ext)=>
      supabase.storage.from('user-avatars').remove([`avatars/${user.id}.${ext}`])
    )
  )

  const {error}= await supabase
    .from('profiles')
    .update({avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if(error)
    return{error: error.message}
  return {success: true}
}

export async function updateAuthEmail(newEmail: string){
  const supabase= await createClient()
  const {data: {user}}= await supabase.auth.getUser()
  if(!user) return {error: "Not authenticated"}

  const trimmed= newEmail.trim().toLowerCase()
  if(!trimmed)return {error: 'Email cannot be empty'}
  if(trimmed===user.email) return {skipped: true}

  const {error}= await supabase.auth.updateUser({email: trimmed})
  if(error) return {error: error.message}

  await supabase
    .from('profiles')
    .update({email: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  
    return {success: true}
}