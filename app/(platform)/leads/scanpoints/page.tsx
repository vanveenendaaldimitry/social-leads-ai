'use client'

import { useEffect, useState } from 'react'

type Scanpoint = {
  id: string
  city: string | null
  lat: number | null
  lng: number | null
  radius: number
  query: string | null
  source: string | null
  status: string
  attempts: number
  last_error: string | null
  created_at: string
  processed_at: string | null
}

export default function ScanpointsPage() {
  const [scanpoints, setScanpoints] = useState<Scanpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<unknown>(null)

  const [form, setForm] = useState({
    location: '',
    radius: '3000',
    query: '',
    type: '',
  })

  const loadScanpoints = () => {
    setLoading(true)
    setError(null)
    fetch('/api/scanpoints?page=1&pageSize=25')
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error)
          return
        }
        setScanpoints(data?.items ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadScanpoints()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scanpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location,
          radius: form.radius ? Number(form.radius) : 3000,
          query: form.query || undefined,
          type: form.type || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error: ${res.status}`)
        return
      }
      setScanpoints((prev) => [data, ...prev])
      setForm((f) => ({ ...f, location: '', query: '', type: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleRun = async (scanpointId?: string) => {
    setRunLoading(true)
    setError(null)
    setRunResult(null)
    try {
      const res = await fetch('/api/scanpoints/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanpointId ? { scanpoint_id: scanpointId } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error: ${res.status}`)
        return
      }
      setRunResult(data)
      if (!scanpointId) {
        // TODO: add Supabase realtime subscription to refresh when n8n updates scanpoint status
        setTimeout(loadScanpoints, 2000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed')
    } finally {
      setRunLoading(false)
    }
  }

  const canCreate = form.location && (form.query || form.type)

  const formatLocation = (s: Scanpoint) => {
    if (s.city) return s.city
    if (s.lat != null && s.lng != null) return `${s.lat},${s.lng}`
    return '—'
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Scanpoints</h1>
      <p className="text-slate-600">
        Create scanpoints for Google Places Nearby Search and trigger the n8n worker.
      </p>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Create scanpoint</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="block text-sm font-medium text-slate-700">Location</span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Utrecht, NL"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              You can enter a city or coordinates. The location will be geocoded automatically.
            </p>
          </label>
          <label>
            <span className="block text-sm font-medium text-slate-700">Radius (m)</span>
            <input
              type="number"
              min={100}
              max={50000}
              value={form.radius}
              onChange={(e) => setForm((f) => ({ ...f, radius: e.target.value }))}
              placeholder="3000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-slate-700">Query</span>
            <input
              type="text"
              value={form.query}
              onChange={(e) => setForm((f) => ({ ...f, query: e.target.value }))}
              placeholder="e.g. restaurant"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-slate-700">Type</span>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="e.g. restaurant"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">At least one of Query or Type is required.</p>
        <button
          type="submit"
          disabled={!canCreate || createLoading}
          className="btn-primary disabled:opacity-50"
        >
          {createLoading ? 'Creating…' : 'Create scanpoint'}
        </button>
      </form>

      {/* TODO: add Supabase realtime subscription on scanpoints table to auto-refresh when n8n updates status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Scanpoints</h2>
          <button
            type="button"
            onClick={() => handleRun()}
            disabled={runLoading}
            className="btn-primary disabled:opacity-50"
          >
            {runLoading ? 'Running…' : 'Run next pending'}
          </button>
        </div>

        {runResult !== null && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <strong>Run result:</strong>
            <pre className="mt-2 overflow-x-auto">{JSON.stringify(runResult, null, 2)}</pre>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : scanpoints.length === 0 ? (
          <p className="text-slate-500">No scanpoints yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Query</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Attempts</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanpoints.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{formatLocation(s)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : s.status === 'completed' || s.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.query ?? '—'}</td>
                    <td className="px-4 py-3">{s.attempts}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRun(s.id)}
                          disabled={runLoading}
                          className="text-violet-600 hover:underline disabled:opacity-50"
                        >
                          Run
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
