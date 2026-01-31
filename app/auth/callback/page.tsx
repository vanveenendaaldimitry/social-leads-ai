'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace('/social/dashboard')
      } else {
        router.replace('/login?error=no_session')
      }
    }
    run()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-purple">
      <p className="rounded-2xl bg-white/95 px-8 py-4 text-lg font-medium text-slate-800 shadow-xl">
        Signing you in...
      </p>
    </div>
  )
}
