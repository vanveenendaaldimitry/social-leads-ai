'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

type BusinessDetail = {
  id: string
  name: string | null
  address: string | null
  city: string | null
  region: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  [key: string]: unknown
}

const FROM_LABELS: Record<string, string> = {
  enrichment: 'Enrichment',
  scored: 'Scored businesses',
  found: 'Found businesses',
}

export default function BusinessDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const from = searchParams?.get('from') ?? 'scored'
  const backLabel = FROM_LABELS[from] ?? 'Business list'
  const backHref = from === 'enrichment' ? '/leads/businesses/enrichment' : from === 'scored' ? '/leads/businesses/scored' : '/leads/businesses'

  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/businesses/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error)
          return
        }
        setBusiness(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <p className="text-slate-500">Loading…</p>
  }

  if (error || !business) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="text-sm text-violet-600 hover:underline">
          ← Back to {backLabel}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error ?? 'Business not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={backHref} className="text-sm text-violet-600 hover:underline">
          ← Back to {backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{business.name ?? 'Unnamed business'}</h1>
        <p className="mt-1 text-slate-600">
          {[business.address, business.city, business.country].filter(Boolean).join(', ')}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-900">{business.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd className="text-slate-900">{business.address ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">City / Region / Country</dt>
              <dd className="text-slate-900">
                {[business.city, business.region, business.country].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-900">{business.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{business.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Website</dt>
              <dd className="text-slate-900">
                {business.website ? (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                    {business.website}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Enrichment & scoring</h2>
          <p className="text-sm text-slate-500">
            Website and email scrape results, AI enrichment output, and scoring will appear here when available.
          </p>
        </section>
      </div>
    </div>
  )
}
