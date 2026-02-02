'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import SidebarNav from './SidebarNav'
import Topbar from './Topbar'

type DashboardLayoutProps = {
  children: React.ReactNode
  email: string | null
}

export default function DashboardLayout({ children, email }: DashboardLayoutProps) {
  const pathname = usePathname()
  const isLeads = pathname?.startsWith('/leads')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const variant = isLeads ? 'leads' : 'social'

  return (
    <div className="flex min-h-screen bg-[#f9fafb]">
      {/* Desktop sidebar - fixed */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-slate-200 bg-white lg:flex"
        aria-label="Sidebar"
      >
        <div className="flex h-12 shrink-0 items-center border-b border-slate-200 px-4">
          <Link
            href={isLeads ? '/leads/dashboard' : '/social/dashboard'}
            className="text-sm font-semibold text-slate-800"
          >
            Socialleads AI
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <SidebarNav variant={variant} />
        </div>
      </aside>

      {/* Mobile sidebar - drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-56 flex-col border-r border-slate-200 bg-white lg:hidden flex"
            aria-label="Sidebar"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <Link
                href={isLeads ? '/leads/dashboard' : '/social/dashboard'}
                className="text-sm font-semibold text-slate-800"
                onClick={() => setSidebarOpen(false)}
              >
                Socialleads AI
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <SidebarNav variant={variant} />
            </div>
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-56">
        <Topbar email={email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-20 lg:pb-6 lg:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>

    </div>
  )
}
