'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(s: unknown, fd: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: fd.get('email') as string,
    password: fd.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signup(s: unknown, fd: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: fd.get('email') as string,
    password: fd.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/auth/pending')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function verifyOtp(s: unknown, fd: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: fd.get('email') as string,
    token: fd.get('otp') as string,
    type: 'email',
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}