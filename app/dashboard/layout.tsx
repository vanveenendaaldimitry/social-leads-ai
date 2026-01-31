import Link from "next/link"

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Social accounts", href: "/dashboard/social-accounts" },
  { label: "Sources", href: "/dashboard/sources" },
  { label: "Audience profiles", href: "/dashboard/audience-profiles" },
  { label: "Messages", href: "/dashboard/messages" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Social Followers AI</div>
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
          {children}
        </div>
      </section>
    </main>
  )
}
