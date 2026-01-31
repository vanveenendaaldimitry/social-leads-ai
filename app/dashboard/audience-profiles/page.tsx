export default function AudienceProfilesPage() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Audience profiles</h1>
          <p className="mt-2 text-neutral-400">
            Profielen die je later gebruikt voor targeting en segmentatie
          </p>
        </div>

        <button className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900">
          New profile
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-300">
        Hier komt straks de tabel met profiles
      </div>
    </div>
  )
}
