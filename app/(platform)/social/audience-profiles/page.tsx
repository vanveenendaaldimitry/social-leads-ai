export default function AudienceProfilesPage() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audience profiles</h1>
          <p className="mt-2 text-slate-600">
            Profielen die je later gebruikt voor targeting en segmentatie
          </p>
        </div>

        <button className="rounded-xl border-2 border-violet-500/50 bg-white px-4 py-2 text-sm font-medium text-violet-600 transition-all duration-200 hover:border-violet-400 hover:bg-violet-50">
          New profile
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/60 bg-slate-50 p-8 text-slate-600 shadow-inner">
        Hier komt straks de tabel met profiles
      </div>
    </div>
  )
}
