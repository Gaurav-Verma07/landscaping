import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL('/auth/login?error=oauth_failed', process.env.NEXT_PUBLIC_SITE_URL!)
    )
  }

  // ✅ Redirect the browser to Google — don't return JSON
  return NextResponse.redirect(data.url)
}