'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type HeaderAuthProps = {
  email: string | null
  /** 'light' for Topbar (white bg), 'dark' for legacy header (purple bg) */
  variant?: 'light' | 'dark'
}

function getInitials(email: string): string {
  const [local] = email.split('@')
  const domain = email.split('@')[1] ?? ''
  const first = local[0]?.toUpperCase() ?? ''
  const second = domain[0]?.toUpperCase() ?? local[1]?.toUpperCase() ?? ''
  return `${first}${second}`
}

export default function HeaderAuth({ email, variant = 'dark' }: HeaderAuthProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isLight = variant === 'light'

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (email) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-full transition-colors ${
            isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/70 hover:text-white/90'
          }`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="User menu"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
              isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white/90'
            }`}
          >
            {getInitials(email)}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[200px] rounded-lg border border-slate-200/80 bg-white py-1.5 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm text-slate-600">{email}</p>
              </div>
              <div className="px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    handleLogout()
                  }}
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className={`text-sm transition-colors ${
        isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/70 hover:text-white/90'
      }`}
    >
      Login
    </Link>
  )
}
