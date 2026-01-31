export default function MessagesPage() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="mt-2 text-neutral-400">
            Overzicht van geplande en verstuurde berichten en acties
          </p>
        </div>

        <button className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900">
          New message
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-sm text-neutral-400">Pending</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-sm text-neutral-400">Running</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-sm text-neutral-400">Done</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-300">
        Hier komt straks de tabel met message logs
      </div>
    </div>
  )
}
