import Link from "next/link"

const items = [
  { label: "Social accounts", href: "/dashboard/social-accounts" },
  { label: "Sources", href: "/dashboard/sources" },
  { label: "Audience profiles", href: "/dashboard/audience-profiles" },
  { label: "Messages", href: "/dashboard/messages" },
]

export default function Dashboard() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Social Followers AI</div>
          <div className="text-sm text-neutral-400">Dashboard</div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            Kies een onderdeel om te beheren
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 transition hover:border-neutral-700 hover:bg-neutral-900"
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-neutral-500 transition group-hover:text-neutral-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
