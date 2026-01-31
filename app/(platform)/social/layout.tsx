export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-200/50">
        {children}
      </div>
    </section>
  )
}
