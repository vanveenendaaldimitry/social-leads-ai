'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HeaderAuth from './HeaderAuth'

const SOCIAL_NAV = [
  { label: 'Dashboard', href: '/social/dashboard' },
  { label: 'Social accounts', href: '/social/social-accounts' },
  { label: 'Sources', href: '/social/sources' },
  { label: 'Audience profiles', href: '/social/audience-profiles' },
  { label: 'Messages', href: '/social/messages' },
]

const LEADS_NAV = [
  { label: 'Dashboard', href: '/leads/dashboard' },
  { label: 'Leads', href: '/leads/leads' },
  { label: 'Campaigns', href: '/leads/campaigns' },
  { label: 'Outreach', href: '/leads/outreach' },
  { label: 'Settings', href: '/leads/settings' },
]

type PlatformHeaderProps = {
  email: string | null
}

export default function PlatformHeader({ email }: PlatformHeaderProps) {
  const pathname = usePathname()
  const isSocial = pathname?.startsWith('/social')
  const isLeads = pathname?.startsWith('/leads')
  const nav = isLeads ? LEADS_NAV : SOCIAL_NAV

  return (
    <header className="bg-gradient-dark shadow-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center">
          <Link
            href={isSocial ? '/social/dashboard' : '/leads/dashboard'}
            className="text-xl font-bold text-white"
          >
            Socialleads AI
          </Link>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            <Link
              href="/social/dashboard"
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isSocial
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              Social Followers
            </Link>
            <Link
              href="/leads/dashboard"
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isLeads
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              Lead Generation
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? 'border border-white/30 bg-white/10 text-white'
                  : 'border border-white/20 bg-white/5 text-white/90 hover:border-violet-400/50 hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-white/20" aria-hidden="true" />
          <HeaderAuth email={email} />
        </div>
      </div>
    </header>
  )
}
