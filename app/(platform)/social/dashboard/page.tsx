import Link from 'next/link'

const items = [
  { label: 'Social accounts', href: '/social/social-accounts' },
  { label: 'Sources', href: '/social/sources' },
  { label: 'Audience profiles', href: '/social/audience-profiles' },
  { label: 'Messages', href: '/social/messages' },
]

export default function SocialDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Kies een onderdeel om te beheren
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white px-6 py-4 shadow-lg shadow-slate-200/50 transition-all duration-200 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100"
          >
            <span className="font-semibold text-slate-800">{item.label}</span>
            <span className="text-violet-500 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
