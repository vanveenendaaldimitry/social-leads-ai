'use client'

import { useEffect, useState } from 'react'

type BusinessRow = {
  id: string
  name: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  scan_status: string | null
  google_types: string[] | null
  primary_type: string | null
  scan_last_at: string | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'pending' },
  { value: 'queued', label: 'queued' },
  { value: 'processing', label: 'processing' },
  { value: 'done', label: 'done' },
  { value: 'error', label: 'error' },
]

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [loading, setLoading] = useState(false)
  const [enqueueLoading, setEnqueueLoading] = useState(false)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ inserted: number; skipped: number } | null>(null)
  const [enrichToast, setEnrichToast] = useState<{
    succeeded: number
    failed: number
    skipped_no_place_id: number
  } | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const refetch = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    if (searchDebounced) params.set('q', searchDebounced)
    if (typeFilter.trim()) params.set('type', typeFilter.trim())
    setLoading(true)
    setError(null)
    fetch(`/api/businesses?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error)
          return
        }
        setBusinesses(data?.data ?? [])
        setTotal(data?.total ?? 0)
        setTotalPages(Math.ceil((data?.total ?? 0) / (data?.pageSize ?? pageSize)))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, pageSize, statusFilter, searchDebounced, typeFilter, refreshKey])

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPage(1)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchDebounced('')
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === businesses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(businesses.map((b) => b.id)))
    }
  }

  const handleEnqueue = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setEnqueueLoading(true)
    setError(null)
    setToast(null)
    setEnrichToast(null)
    try {
      const res = await fetch('/api/business-scans/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_ids: ids }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error: ${res.status}`)
        return
      }
      setToast({ inserted: data.inserted ?? 0, skipped: data.skipped ?? 0 })
      setSelectedIds(new Set())
      refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enqueue')
    } finally {
      setEnqueueLoading(false)
    }
  }

  const handleEnrich = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setEnrichLoading(true)
    setError(null)
    setToast(null)
    setEnrichToast(null)
    try {
      const res = await fetch('/api/businesses/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_ids: ids }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error: ${res.status}`)
        return
      }
      setEnrichToast({
        succeeded: data.succeeded ?? 0,
        failed: data.failed ?? 0,
        skipped_no_place_id: data.skipped_no_place_id ?? 0,
      })
      setSelectedIds(new Set())
      refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enrich')
    } finally {
      setEnrichLoading(false)
    }
  }

  const hasSelection = selectedIds.size > 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
      <p className="text-slate-600">
        View and manage businesses. Select rows and enqueue scans for processing.
      </p>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {toast !== null && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Enqueued {toast.inserted} scan{toast.inserted !== 1 ? 's' : ''}
          {toast.skipped > 0 ? `, ${toast.skipped} skipped (already active)` : ''}.
        </div>
      )}

      {enrichToast !== null && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Enriched {enrichToast.succeeded} business{enrichToast.succeeded !== 1 ? 'es' : ''}
          {enrichToast.failed > 0 ? `, ${enrichToast.failed} failed` : ''}
          {enrichToast.skipped_no_place_id > 0 ? `, ${enrichToast.skipped_no_place_id} skipped (no place_id)` : ''}.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Business list</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name, address, phone..."
                className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 pr-8 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Status</span>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Type</span>
              <input
                type="text"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                placeholder="e.g. restaurant"
                className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
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
              onClick={handleEnqueue}
              disabled={!hasSelection || enqueueLoading}
              className="btn-primary disabled:opacity-50"
            >
              {enqueueLoading ? 'Enqueuing…' : 'Scan selected'}
            </button>
            <button
              type="button"
              onClick={handleEnrich}
              disabled={!hasSelection || enrichLoading}
              className="btn-primary disabled:opacity-50"
            >
              {enrichLoading ? 'Enriching…' : 'Enrich selected'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : businesses.length === 0 ? (
          <p className="text-slate-500">No businesses yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === businesses.length && businesses.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Address</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Website</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Scan status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Types</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(b.id)}
                          onChange={() => toggleSelect(b.id)}
                          aria-label={`Select ${b.name ?? b.id}`}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{b.address ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{b.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{b.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.website ? (
                          <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                            {b.website}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.scan_status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : b.scan_status === 'queued'
                                ? 'bg-blue-100 text-blue-800'
                                : b.scan_status === 'processing'
                                  ? 'bg-sky-100 text-sky-800'
                                  : b.scan_status === 'done'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.scan_status === 'error'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.scan_status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.primary_type ?? (b.google_types?.length ? b.google_types.join(', ') : '—')}
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
