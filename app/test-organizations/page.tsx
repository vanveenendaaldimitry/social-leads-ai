import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import HeaderAuth from '../components/HeaderAuth'

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

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user

  const { data, error } = await supabase
    .from('organizations')
    .select('*')

  return (
    <main className="min-h-screen bg-[#f9fafb]">
      <header className="bg-gradient-purple-header shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="text-xl font-bold text-white">Social Followers AI</div>
          <div className="flex items-center gap-2">
            <Link
              href="/social/dashboard"
              className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
            >
              Dashboard
            </Link>
            <span className="ml-2 h-5 w-px bg-white/20" aria-hidden="true" />
            <HeaderAuth email={user?.email ?? null} />
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-6 rounded-2xl border border-slate-200/50 bg-white p-8 shadow-lg shadow-slate-200/40">
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              user
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {user ? `Authenticated: ${user.email} (${user.id})` : 'Not authenticated'}
          </p>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-6 shadow-inner">
            <pre className="overflow-x-auto text-sm text-slate-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  )
}
