import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import HeaderAuth from "./components/HeaderAuth"

export default async function Home() {
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
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen">
      <header className="absolute right-0 top-0 z-10 px-6 py-5">
        <HeaderAuth email={user?.email ?? null} />
      </header>
      <section className="bg-gradient-purple px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Social Followers AI
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Dashboard is live 🚀
          </p>
          <Link
            href="/login"
            className="btn-primary mt-8 inline-block"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-bold text-slate-900">Get started</h2>
          <p className="mt-3 text-slate-600">
            Sign in to access your dashboard and manage your social accounts.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl border-2 border-violet-500 px-6 py-2 font-medium text-violet-600 transition-colors hover:bg-violet-50"
          >
            Go to login →
          </Link>
        </div>
      </section>
    </main>
  )
}
