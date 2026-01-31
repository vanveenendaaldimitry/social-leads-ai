import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function Page() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // in server components cookies can be read only
          }
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('organizations')
    .select('*')

  return (
    <div style={{ padding: 24 }}>
      <h1>Test organizations</h1>
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
