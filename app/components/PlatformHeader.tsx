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
  { label: 'Scanpoints', href: '/leads/scanpoints' },
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
    <header className="bg-gradient-purple-header shadow-lg">
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
          <div className="flex items-center gap-2 rounded-full bg-white/20 p-1">
            <Link
              href="/social/dashboard"
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                isSocial
                  ? 'bg-white text-violet-600 shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              Social Followers
            </Link>
            <Link
              href="/leads/dashboard"
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                isLeads
                  ? 'bg-white text-violet-600 shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
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
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-white/30" aria-hidden="true" />
          <HeaderAuth email={email} />
        </div>
      </div>
    </header>
  )
}
