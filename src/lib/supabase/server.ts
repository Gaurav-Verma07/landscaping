import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            // Cookie writes are only permitted in Server Actions and Route Handlers.
            // In Server Components (e.g. layout.tsx) this will throw — silently
            // ignore it. The session is still readable via getAll above.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Intentionally ignored — read-only context (Server Component)
          }
        },
      },
    }
  )
}