'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBusinessAddress } from '@/lib/address/formatBusinessAddress'

export type BusinessRow = {
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
  address_street?: string | null
  address_postal_code?: string | null
  address_city?: string | null
  address_country?: string | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending,enriched', label: 'Found (pending + enriched)' },
  { value: 'scraped', label: 'Scraped' },
  { value: 'done', label: 'Done' },
  { value: 'pending', label: 'pending' },
  { value: 'enriched', label: 'enriched' },
  { value: 'queued', label: 'queued' },
  { value: 'processing', label: 'processing' },
  { value: 'error', label: 'error' },
]

function MailIcon({ muted }: { muted?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={muted ? 'text-slate-300' : 'text-slate-500'} aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LinkIcon({ muted }: { muted?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={muted ? 'text-slate-300' : 'text-slate-500'} aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  )
}

export type ViewMode = 'found' | 'enrichment' | 'scored'

export type BusinessesListProps = {
  viewMode: ViewMode
  title: string
  description: string
  initialStatus?: string
}

const VIEW_CONFIG: Record<ViewMode, {
  fixedStatus: 'scraped' | 'done' | null
  showFilterBar: boolean
  showStatusColumn: boolean
  showBulkActions: boolean
  showCheckboxes: boolean
  rowClickHrefBase: string | null
  rowClickFrom?: string
}> = {
  found: { fixedStatus: null, showFilterBar: true, showStatusColumn: true, showBulkActions: true, showCheckboxes: true, rowClickHrefBase: null },
  // Enrichment view: no navigation to detail page
  enrichment: { fixedStatus: 'scraped', showFilterBar: false, showStatusColumn: false, showBulkActions: true, showCheckboxes: true, rowClickHrefBase: null, rowClickFrom: 'enrichment' },
  scored: { fixedStatus: 'done', showFilterBar: false, showStatusColumn: false, showBulkActions: false, showCheckboxes: false, rowClickHrefBase: '/leads/businesses/', rowClickFrom: 'scored' },
}

export default function BusinessesList({
  viewMode,
  title,
  description,
  initialStatus = 'all',
}: BusinessesListProps) {
  const config = VIEW_CONFIG[viewMode] ?? VIEW_CONFIG.found
  const { fixedStatus, showFilterBar, showStatusColumn, showBulkActions, showCheckboxes, rowClickHrefBase, rowClickFrom } = config
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [loading, setLoading] = useState(false)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrichToast, setEnrichToast] = useState<{ succeeded: number; failed: number; skipped_no_place_id: number } | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState<string>(fixedStatus ?? initialStatus)
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const effectiveStatus = fixedStatus ?? statusFilter
  const refetch = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    if (fixedStatus) setStatusFilter(fixedStatus)
    else setStatusFilter(initialStatus)
  }, [fixedStatus, initialStatus])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (viewMode === 'enrichment') params.set('view', 'enrichment')
    else if (viewMode === 'scored') params.set('view', 'scored')
    else if (effectiveStatus && effectiveStatus !== 'all') params.set('status', effectiveStatus)
    if (searchDebounced && showFilterBar) params.set('q', searchDebounced)
    if (typeFilter.trim() && showFilterBar) params.set('type', typeFilter.trim())
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
  }, [page, pageSize, viewMode, effectiveStatus, searchDebounced, typeFilter, showFilterBar, refreshKey])

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

  const handleEnrich = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setEnrichLoading(true)
    setError(null)
    setEnrichToast(null)
    const endpoint = viewMode === 'enrichment' ? '/api/ai-enrich' : '/api/businesses/enrich'
    if (viewMode === 'enrichment') {
      console.log('[Enrichment] calling ai-enrich with ids count:', ids.length)
    }
    try {
      let body: { business_ids: string[]; profile_key?: string } = { business_ids: ids }
      if (viewMode === 'enrichment') {
        const orgRes = await fetch('/api/organizations')
        const orgs = await orgRes.json().catch(() => [])
        const profile_key = Array.isArray(orgs) && orgs[0]?.id != null ? String(orgs[0].id) : 'default'
        body = { business_ids: ids, profile_key }
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? `Enrichment failed (${res.status}). Check logs.`)
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
      setError(e instanceof Error ? e.message : 'Enrichment failed. Check logs.')
    } finally {
      setEnrichLoading(false)
    }
  }

  const handleRowClick = (id: string) => {
    if (rowClickHrefBase) {
      const href = rowClickFrom ? `${rowClickHrefBase}${id}?from=${rowClickFrom}` : `${rowClickHrefBase}${id}`
      router.push(href)
    }
  }

  const hasSelection = selectedIds.size > 0
  const rowClickable = !!rowClickHrefBase

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-600">{description}</p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {enrichToast !== null && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          Enriched {enrichToast.succeeded} business{enrichToast.succeeded !== 1 ? 'es' : ''}
          {enrichToast.failed > 0 ? `, ${enrichToast.failed} failed` : ''}
          {enrichToast.skipped_no_place_id > 0 ? `, ${enrichToast.skipped_no_place_id} skipped (no place_id)` : ''}.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Business list</h2>
          <div className="flex flex-wrap items-center gap-3">
            {showFilterBar && (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search name, address, phone..."
                  className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 pr-8 text-sm"
                />
                {searchInput && (
                  <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-2 text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {showFilterBar && (
              <label className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Status</span>
                <select value={statusFilter} onChange={handleStatusChange} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            )}
            {showFilterBar && (
              <label className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Type</span>
                <input
                  type="text"
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                  placeholder="e.g. restaurant"
                  className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
            )}
            {showFilterBar && (
              <label className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Per page</span>
                <select value={pageSize} onChange={handlePageSizeChange} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            )}
            {showBulkActions && (
              <button type="button" onClick={handleEnrich} disabled={!hasSelection || enrichLoading} className="btn-primary disabled:opacity-50">
                {enrichLoading ? 'Enriching…' : 'Enrich selected'}
              </button>
            )}
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
                    {showCheckboxes && (
                      <th className="w-10 px-2 py-3 text-center">
                        <input type="checkbox" checked={selectedIds.size === businesses.length && businesses.length > 0} onChange={toggleSelectAll} aria-label="Select all" className="rounded border-slate-300" />
                      </th>
                    )}
                    <th className="max-w-[140px] px-3 py-3 text-left font-medium text-slate-700">Name</th>
                    <th className="max-w-[160px] px-3 py-3 text-left font-medium text-slate-700">Address</th>
                    <th className="max-w-[110px] px-3 py-3 text-left font-medium text-slate-700">Phone</th>
                    <th className="w-12 px-2 py-3 text-center font-medium text-slate-700" title="Email"><MailIcon muted /></th>
                    <th className="w-12 px-2 py-3 text-center font-medium text-slate-700" title="Website"><LinkIcon muted /></th>
                    {showStatusColumn && (
                      <th className="w-24 px-2 py-3 text-left font-medium text-slate-700">Status</th>
                    )}
                    <th className="max-w-[120px] px-3 py-3 text-left font-medium text-slate-700">Types</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => (
                    <tr
                      key={b.id}
                      className={`border-b border-slate-100 ${rowClickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                      onClick={() => handleRowClick(b.id)}
                      role={rowClickable ? 'button' : undefined}
                      tabIndex={rowClickable ? 0 : undefined}
                      onKeyDown={(e) => rowClickable && (e.key === 'Enter' || e.key === ' ') && handleRowClick(b.id)}
                    >
                      {showCheckboxes && (
                        <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} aria-label={`Select ${b.name ?? b.id}`} className="rounded border-slate-300" />
                        </td>
                      )}
                      <td className="max-w-[140px] px-3 py-3 text-slate-600"><span className="block truncate" title={b.name ?? undefined}>{b.name ?? '—'}</span></td>
                      <td className="max-w-[160px] px-3 py-3 text-slate-600">
                        <span
                          className="block truncate"
                          title={
                            viewMode === 'scored'
                              ? formatBusinessAddress({
                                  address_street: b.address_street,
                                  address_postal_code: b.address_postal_code,
                                  address_city: b.address_city,
                                  address_country: b.address_country,
                                  address: b.address,
                                }) || undefined
                              : b.address ?? undefined
                          }
                        >
                          {viewMode === 'scored'
                            ? (formatBusinessAddress({
                                address_street: b.address_street,
                                address_postal_code: b.address_postal_code,
                                address_city: b.address_city,
                                address_country: b.address_country,
                                address: b.address,
                              }) || '—')
                            : (b.address ?? '—')}
                        </span>
                      </td>
                      <td className="max-w-[110px] px-3 py-3 text-slate-600"><span className="block truncate" title={b.phone ?? undefined}>{b.phone ?? '—'}</span></td>
                      <td className="w-12 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {b.email ? (
                          <a href={`mailto:${b.email}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-violet-600 hover:text-violet-700" aria-label={`Email ${b.email}`}><MailIcon /></a>
                        ) : (
                          <span className="inline-flex items-center justify-center" aria-hidden><MailIcon muted /></span>
                        )}
                      </td>
                      <td className="w-12 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {b.website ? (
                          <a href={b.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-violet-600 hover:text-violet-700" aria-label={`Open website ${b.website}`}><LinkIcon /></a>
                        ) : (
                          <span className="inline-flex items-center justify-center" aria-hidden><LinkIcon muted /></span>
                        )}
                      </td>
                      {showStatusColumn && (
                        <td className="w-24 px-2 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.scan_status === 'pending' ? 'bg-amber-100 text-amber-800' : b.scan_status === 'queued' ? 'bg-blue-100 text-blue-800' : b.scan_status === 'processing' ? 'bg-sky-100 text-sky-800' : b.scan_status === 'done' ? 'bg-emerald-100 text-emerald-800' : b.scan_status === 'error' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                            {b.scan_status ?? '—'}
                          </span>
                        </td>
                      )}
                      <td className="max-w-[120px] px-3 py-3 text-slate-600"><span className="block truncate" title={b.primary_type ?? b.google_types?.join(', ') ?? undefined}>{b.primary_type ?? (b.google_types?.length ? b.google_types.join(', ') : '—')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm text-slate-600">Page {page} of {totalPages} ({total} total)</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxVisible = 9
                      const half = Math.floor(maxVisible / 2)
                      let start = Math.max(1, page - half)
                      let end = Math.min(totalPages, start + maxVisible - 1)
                      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
                      const pages: number[] = []
                      for (let n = start; n <= end; n++) pages.push(n)
                      return pages.map((n) => (
                        <button key={n} type="button" onClick={() => setPage(n)} className={`rounded-lg px-3 py-1.5 text-sm ${n === page ? 'bg-violet-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}>{n}</button>
                      ))
                    })()}
                  </div>
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
