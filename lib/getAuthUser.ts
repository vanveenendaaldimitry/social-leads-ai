import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Get the current authenticated user in API routes or server components.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op: read-only in API routes
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
