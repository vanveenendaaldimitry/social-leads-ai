'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { parseAiList } from '@/lib/ai/parseAiFields'
import { parseCityFromAddress } from '@/lib/address/parseCity'

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
  scan_status?: string | null
  ai_state?: string | null
  ai_updated_at?: string | null
  ai_suggested_category?: string | null
  ai_outreach_angle?: string | null
  ai_reasons?: unknown
  ai_quick_wins?: unknown
  ai_website_quality_score?: number | null
  ai_conversion_score?: number | null
  ai_lead_score?: number | null
  ai_score?: number | null
  ai_result?: Record<string, unknown> | null
  [key: string]: unknown
}

const FROM_LABELS: Record<string, string> = {
  enrichment: 'Enrichment',
  scored: 'Scored businesses',
  found: 'Found businesses',
}

function ScoreMeter({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-700">{pct}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function getAiValue<T>(b: BusinessDetail, key: string, fallbackKey?: string): T | null {
  const top = b[key]
  if (top != null && top !== '') return top as T
  const result = b.ai_result as Record<string, unknown> | null | undefined
  if (result && typeof result === 'object') {
    const fromResult = result[key] ?? result[fallbackKey ?? key]
    if (fromResult != null && fromResult !== '') return fromResult as T
  }
  return null
}

function getAiScore(b: BusinessDetail): number | null {
  const lead = getAiValue<number>(b, 'ai_lead_score', 'ai_score')
  if (typeof lead === 'number') return lead
  const score = getAiValue<number>(b, 'ai_score')
  if (typeof score === 'number') return score
  return null
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

  const displayCity = business.city?.trim() || parseCityFromAddress(business.address)
  const locationParts = [business.address, displayCity || business.region, business.country].filter(Boolean)
  const locationStr = locationParts.join(', ')

  const leadScore = getAiScore(business)
  const webScore = getAiValue<number>(business, 'ai_website_quality_score') ?? 0
  const convScore = getAiValue<number>(business, 'ai_conversion_score') ?? 0
  const suggestedCategory = getAiValue<string>(business, 'ai_suggested_category')
  const outreachAngle = getAiValue<string>(business, 'ai_outreach_angle')
  const reasonsRaw = getAiValue<unknown>(business, 'ai_reasons')
  const quickWinsRaw = getAiValue<unknown>(business, 'ai_quick_wins')
  const reasons = parseAiList(reasonsRaw)
  const quickWins = parseAiList(quickWinsRaw)
  const scanStatus = business.scan_status ?? (business as { scan_status?: string }).scan_status ?? null
  const aiState = getAiValue<string>(business, 'ai_state')
  const aiUpdatedAt = getAiValue<string>(business, 'ai_updated_at')

  const hasAiData = leadScore != null || webScore > 0 || convScore > 0 || suggestedCategory || outreachAngle || reasons.length > 0 || quickWins.length > 0

  const formatDate = (d: string | null | undefined) => {
    if (!d) return null
    try {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={backHref} className="text-sm text-violet-600 hover:underline">
          ← Back to {backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{business.name ?? 'Unnamed business'}</h1>
        <p className="mt-1 text-slate-600">{locationStr || '—'}</p>
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
                {[displayCity || business.city, business.region, business.country].filter(Boolean).join(', ') || '—'}
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
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Enrichment and scoring</h2>
          {!hasAiData && (
            <p className="text-sm text-slate-500">
              Website and email scrape results, AI enrichment output, and scoring will appear here when available.
            </p>
          )}
          {hasAiData && (
            <div className="space-y-4">
              {(leadScore != null || webScore > 0 || convScore > 0) && (
                <div className="space-y-3">
                  {leadScore != null && <ScoreMeter value={leadScore} label="Lead score" />}
                  <ScoreMeter value={webScore} label="Website quality" />
                  <ScoreMeter value={convScore} label="Conversion score" />
                </div>
              )}
              {suggestedCategory && (
                <div>
                  <dt className="text-xs text-slate-500">Suggested category</dt>
                  <dd className="text-sm text-slate-900">{suggestedCategory}</dd>
                </div>
              )}
              {outreachAngle && (
                <div>
                  <dt className="text-xs text-slate-500">Outreach angle</dt>
                  <dd className="text-sm text-slate-900">{outreachAngle}</dd>
                </div>
              )}
              {reasons.length > 0 && (
                <div>
                  <dt className="mb-1 text-xs text-slate-500">Reasons</dt>
                  <dd>
                    <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-900">
                      {reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {quickWins.length > 0 && (
                <div>
                  <dt className="mb-1 text-xs text-slate-500">Quick wins</dt>
                  <dd>
                    <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-900">
                      {quickWins.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              <dl className="space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
                {scanStatus && (
                  <div>
                    <dt className="inline">Scan status:</dt>
                    <dd className="inline ml-1">{scanStatus}</dd>
                  </div>
                )}
                {aiState && (
                  <div>
                    <dt className="inline">AI state:</dt>
                    <dd className="inline ml-1">{aiState}</dd>
                  </div>
                )}
                {aiUpdatedAt && formatDate(aiUpdatedAt) && (
                  <div>
                    <dt className="inline">AI updated:</dt>
                    <dd className="inline ml-1">{formatDate(aiUpdatedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
