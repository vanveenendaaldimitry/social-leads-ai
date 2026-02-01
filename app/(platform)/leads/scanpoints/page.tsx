'use client'

import { useEffect, useState } from 'react'

type Scanpoint = {
  id: string
  city: string | null
  lat: number | null
  lng: number | null
  radius: number
  source: string | null
  status: string
  attempts: number
  last_error: string | null
  created_at: string
  processed_at: string | null
  display_location: string
}

export default function ScanpointsPage() {
  const [scanpoints, setScanpoints] = useState<Scanpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<unknown>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [form, setForm] = useState({
    location: '',
    radius: '3000',
  })

  const refetch = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    setLoading(true)
    setError(null)
    fetch(`/api/scanpoints?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error)
          return
        }
        setScanpoints(data?.items ?? [])
        setTotal(data?.total ?? 0)
        setTotalPages(data?.totalPages ?? 0)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, pageSize, statusFilter, refreshKey])

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/scanpoints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location,
          radius: form.radius ? Number(form.radius) : 3000,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error: ${res.status}`)
        return
      }
      setSuccessMsg('Scanpoints are being generated')
      setForm((f) => ({ ...f, location: '' }))
      setPage(1)
      refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
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
        setTimeout(refetch, 2000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed')
    } finally {
      setRunLoading(false)
    }
  }

  const canCreate = Boolean(form.location?.trim())

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

      {successMsg && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMsg}
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
        </div>
        <button
          type="submit"
          disabled={!canCreate || createLoading}
          className="btn-primary disabled:opacity-50"
        >
          {createLoading ? 'Generating…' : 'Create scanpoint'}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Scanpoints</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Status</span>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="done">done</option>
                <option value="error">error</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Per page</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => handleRun()}
              disabled={runLoading}
              className="btn-primary disabled:opacity-50"
            >
              {runLoading ? 'Running…' : 'Run next pending'}
            </button>
          </div>
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
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Attempts</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scanpoints.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-slate-600">{s.display_location}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : s.status === 'completed' || s.status === 'done'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
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

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-600">
                  Page {page} of {totalPages} ({total} total)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxVisible = 9
                      const half = Math.floor(maxVisible / 2)
                      let start = Math.max(1, page - half)
                      let end = Math.min(totalPages, start + maxVisible - 1)
                      if (end - start + 1 < maxVisible) {
                        start = Math.max(1, end - maxVisible + 1)
                      }
                      const pages: number[] = []
                      for (let n = start; n <= end; n++) pages.push(n)
                      return pages.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={`rounded-lg px-3 py-1.5 text-sm ${
                            n === page
                              ? 'bg-violet-600 text-white'
                              : 'border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {n}
                        </button>
                      ))
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
