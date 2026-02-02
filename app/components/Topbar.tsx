'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import HeaderAuth from './HeaderAuth'

type TopbarProps = {
  email: string | null
  onMenuClick?: () => void
}

export default function Topbar({ email, onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const isSocial = pathname?.startsWith('/social')
  const isLeads = pathname?.startsWith('/leads')

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white px-4"
      role="banner"
    >
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link
          href={isSocial ? '/social/dashboard' : '/leads/dashboard'}
          className="text-sm font-semibold text-slate-700"
        >
          Socialleads AI
        </Link>
        <span className="text-slate-300" aria-hidden>|</span>
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50/50 p-0.5">
          <Link
            href="/social/dashboard"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isSocial ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Social Followers
          </Link>
          <Link
            href="/leads/dashboard"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isLeads ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lead Generation
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <HeaderAuth email={email} variant="light" />
      </div>
    </header>
  )
}
