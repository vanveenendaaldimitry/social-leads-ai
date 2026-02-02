'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ScanSearch,
  Building2,
  Sparkles,
  BadgeCheck,
  Users,
  Send,
  Megaphone,
  Settings,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  section?: string
}

// Lead Generation sidebar config
const LEADS_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/leads/dashboard', icon: LayoutDashboard },
  { label: 'Scanpoints', href: '/leads/scanpoints', icon: ScanSearch, section: 'Data' },
  { label: 'Found businesses', href: '/leads/businesses', icon: Building2, section: 'Data' },
  { label: 'Enrichment', href: '/leads/businesses/enrichment', icon: Sparkles, section: 'Analysis' },
  { label: 'Scored businesses', href: '/leads/businesses/scored', icon: BadgeCheck, section: 'Analysis' },
  { label: 'Leads', href: '/leads/leads', icon: Users, section: 'Action' },
  { label: 'Outreach', href: '/leads/outreach', icon: Send, section: 'Action' },
  { label: 'Campaigns', href: '/leads/campaigns', icon: Megaphone, section: 'Management' },
  { label: 'Settings', href: '/leads/settings', icon: Settings, section: 'Management' },
]

// Social Followers sidebar config (icons mapped from existing nav)
const SOCIAL_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/social/dashboard', icon: LayoutDashboard },
  { label: 'Social accounts', href: '/social/social-accounts', icon: Users },
  { label: 'Sources', href: '/social/sources', icon: Megaphone },
  { label: 'Audience profiles', href: '/social/audience-profiles', icon: BadgeCheck },
  { label: 'Messages', href: '/social/messages', icon: Send },
]

type SidebarNavProps = {
  variant: 'leads' | 'social'
}

function SidebarNavInner({ variant }: SidebarNavProps) {
  const pathname = usePathname()
  const items = variant === 'leads' ? LEADS_NAV : SOCIAL_NAV

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href === '/leads/businesses' && pathname?.startsWith('/leads/businesses/')) return false
    return false
  }

  const grouped = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section ?? 'Main'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})

  const sections = Object.entries(grouped)

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 py-4">
      {sections.map(([section, sectionItems]) => (
        <div key={section} className="mb-2">
          {section !== 'Main' && (
            <div className="mb-1 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              {section}
            </div>
          )}
          <ul className="space-y-0.5">
            {sectionItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function SidebarNav({ variant }: SidebarNavProps) {
  return (
    <Suspense fallback={<div className="animate-pulse px-3 py-2 text-sm text-slate-400">Loading…</div>}>
      <SidebarNavInner variant={variant} />
    </Suspense>
  )
}
