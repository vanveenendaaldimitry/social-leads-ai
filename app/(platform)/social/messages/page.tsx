export default function MessagesPage() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="mt-2 text-slate-600">
            Overzicht van geplande en verstuurde berichten en acties
          </p>
        </div>

        <button className="rounded-xl border-2 border-violet-500/50 bg-white px-4 py-2 text-sm font-medium text-violet-600 transition-all duration-200 hover:border-violet-400 hover:bg-violet-50">
          New message
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/50 transition-shadow hover:shadow-xl">
          <div className="text-sm font-medium text-slate-500">Pending</div>
          <div className="mt-2 text-2xl font-bold text-violet-600">0</div>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/50 transition-shadow hover:shadow-xl">
          <div className="text-sm font-medium text-slate-500">Running</div>
          <div className="mt-2 text-2xl font-bold text-violet-600">0</div>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/50 transition-shadow hover:shadow-xl">
          <div className="text-sm font-medium text-slate-500">Done</div>
          <div className="mt-2 text-2xl font-bold text-violet-600">0</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/60 bg-slate-50 p-8 text-slate-600 shadow-inner">
        Hier komt straks de tabel met message logs
      </div>
    </div>
  )
}
