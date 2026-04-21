'use server'

import { redirect } from 'next/navigation'

export async function signOut() {
  redirect('/')
}

export async function login(s: unknown, fd: FormData) {
  return { error: 'Auth not configured.' }
}

export async function signup(s: unknown, fd: FormData) {
  return { error: 'Auth not configured.' }
}

export async function verifyOtp(s: unknown, fd: FormData) {
  return { error: 'Auth not configured.' }
}
