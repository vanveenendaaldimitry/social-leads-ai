'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const signInWithPassword = async () => {
    setMsg('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }
    router.replace('/social/dashboard')
  }

  const sendLink = async () => {
    setMsg('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }

    setMsg('Check je mail en klik de link')
  }

  const check = async () => {
    const { data } = await supabase.auth.getUser()
    setMsg(`Current user: ${data.user?.email ?? 'none'}`)
  }

  return (
    <div className="min-h-screen bg-gradient-purple">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-indigo-900/20 backdrop-blur">
          <h1 className="text-center text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Social Followers AI
          </p>

          <div className="mt-8 space-y-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={signInWithPassword}
              className="btn-primary w-full"
            >
              Sign in with password
            </button>
            <button
              onClick={sendLink}
              className="w-full rounded-xl border-2 border-violet-500/50 bg-white/80 px-6 py-3 font-medium text-violet-700 transition-all duration-200 hover:border-violet-400 hover:bg-white"
            >
              Send magic link
            </button>
            <button
              onClick={check}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Check session
            </button>
          </div>

          {msg && (
            <pre className="mt-6 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
              {msg}
            </pre>
          )}

          <Link
            href="/"
            className="mt-6 block text-center text-sm text-violet-600 hover:text-violet-700"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
