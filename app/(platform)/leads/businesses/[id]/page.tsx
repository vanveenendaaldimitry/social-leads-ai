'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { formatBusinessAddress } from '@/lib/address/formatBusinessAddress'

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
  address_street?: string | null
  address_postal_code?: string | null
  address_city?: string | null
  address_country?: string | null
  ai_lead_score?: number | null
  ai_score?: number | null
  ai_website_quality_score?: number | null
  ai_conversion_score?: number | null
  ai_suggested_category?: string | null
  ai_reasons?: string | string[] | null
  ai_quick_wins?: string | string[] | null
  ai_outreach_angle?: string | null
  ai_state?: string | null
  ai_updated_at?: string | null
  ai_result?: Record<string, unknown> | null
  [key: string]: unknown
}

function parseAiList(val: unknown): string[] {
  if (val == null) return []
  if (Array.isArray(val)) return val.filter((x): x is string => typeof x === 'string')
  if (typeof val === 'string') {
    const t = val.trim()
    if (!t) return []
    try {
      const parsed = JSON.parse(t) as unknown
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [t]
    } catch {
      return [t]
    }
  }
  return []
}

function getAiValue(b: BusinessDetail, topKey: string, resultKey?: string): unknown {
  const top = b[topKey]
  if (top !== undefined && top !== null && top !== '') return top
  const result = b.ai_result as Record<string, unknown> | undefined
  if (result && resultKey && result[resultKey] !== undefined && result[resultKey] !== null) return result[resultKey]
  return undefined
}

/** Parse value to number; treat NaN and non-numeric as null (handles string "42"). */
function toNumberOrNull(val: unknown): number | null {
  if (val == null) return null
  const n = Number(val)
  return Number.isNaN(n) ? null : n
}

const FROM_LABELS: Record<string, string> = {
  enrichment: 'Enrichment',
  scored: 'Scored businesses',
  found: 'Found businesses',
}

const SCORE_MAX = 100

function ScoreGauge({
  label,
  value,
  size = 'md',
  max = SCORE_MAX,
}: {
  label: string
  value: number | null
  size?: 'lg' | 'md' | 'sm'
  max?: number
}) {
  const hasValue = value != null && !Number.isNaN(Number(value))
  const num = hasValue ? Math.min(max, Math.max(0, Number(value))) : 0
  const deg = max > 0 ? (num / max) * 360 : 0
  const sizeMap = { lg: 'h-28 w-28 border-[10px]', md: 'h-20 w-20 border-8', sm: 'h-16 w-16 border-6' }
  const innerMap = { lg: 'inset-2.5', md: 'inset-2', sm: 'inset-1.5' }
  const textMap = { lg: 'text-2xl', md: 'text-lg', sm: 'text-sm' }
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div
        className={`relative shrink-0 rounded-full border border-slate-200 ${sizeMap[size]}`}
        style={{ background: `conic-gradient(#8b5cf6 ${deg}deg, #e2e8f0 ${deg}deg)` }}
        aria-label={hasValue ? `${label} ${num} out of ${max}` : `${label} pending`}
      >
        <div className={`absolute ${innerMap[size]} flex items-center justify-center rounded-full bg-white`}>
          <span className={`font-bold ${textMap[size]} ${!hasValue ? 'text-slate-400' : 'text-slate-900'}`}>
            {hasValue ? num : '—'}
          </span>
        </div>
      </div>
      {!hasValue && <span className="text-xs text-slate-400">Pending</span>}
    </div>
  )
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

  const headerAddress = formatBusinessAddress({
    address_street: business.address_street,
    address_postal_code: business.address_postal_code,
    address_city: business.address_city,
    address_country: business.address_country,
    address: business.address,
  })

  const addressStreet =
    (business.address_street ?? '').trim() || (business.address ?? '')

  const cityValue = (business.address_city ?? '').trim()
  const postalValue = (business.address_postal_code ?? '').trim()
  let cityPostal = ''
  if (cityValue && postalValue) {
    cityPostal = `${cityValue}, ${postalValue}`
  } else if (cityValue) {
    cityPostal = cityValue
  } else if (postalValue) {
    cityPostal = postalValue
  }

  const countryValue = (business.address_country ?? '').trim()

  const leadScore =
    toNumberOrNull(getAiValue(business, 'ai_lead_score', 'lead_score')) ??
    toNumberOrNull(getAiValue(business, 'ai_score', 'score')) ??
    null
  const webScore = toNumberOrNull(getAiValue(business, 'ai_website_quality_score', 'website_quality_score'))
  const convScore = toNumberOrNull(getAiValue(business, 'ai_conversion_score', 'conversion_score'))
  const suggestedCategory = (getAiValue(business, 'ai_suggested_category', 'suggested_category') as string | undefined) ?? ''
  const reasons = parseAiList(getAiValue(business, 'ai_reasons', 'reasons'))
  const quickWins = parseAiList(getAiValue(business, 'ai_quick_wins', 'quick_wins'))
  const outreachAngle = (getAiValue(business, 'ai_outreach_angle', 'outreach_angle') as string | undefined) ?? ''
  const aiState = (getAiValue(business, 'ai_state', 'ai_state') as string | undefined) ?? ''
  const aiUpdatedAt = (getAiValue(business, 'ai_updated_at', 'ai_updated_at') as string | undefined) ?? ''

  const hasScores = leadScore != null || webScore != null || convScore != null
  const hasAiContent =
    hasScores ||
    suggestedCategory.trim() !== '' ||
    reasons.length > 0 ||
    quickWins.length > 0 ||
    outreachAngle.trim() !== ''

  return (
    <div className="space-y-8">
      <div>
        <Link href={backHref} className="text-sm text-violet-600 hover:underline">
          ← Back to {backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{business.name ?? 'Unnamed business'}</h1>
        <p className="mt-1 text-slate-600">
          {headerAddress || business.address || ''}
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
              <dd className="text-slate-900">{addressStreet || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">City / Postal code</dt>
              <dd className="text-slate-900">{cityPostal}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Country</dt>
              <dd className="text-slate-900">{countryValue}</dd>
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

          {!hasAiContent ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Awaiting enrichment
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score gauges – same style for all three */}
              <div className="flex flex-wrap items-end gap-8">
                <ScoreGauge label="Lead score" value={leadScore} size="lg" max={SCORE_MAX} />
                <ScoreGauge label="Website quality" value={webScore} size="sm" max={SCORE_MAX} />
                <ScoreGauge label="Conversion" value={convScore} size="sm" max={SCORE_MAX} />
              </div>

              {/* AI fields – uniform section headers and spacing */}
              {suggestedCategory.trim() !== '' && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested category</h3>
                  <p className="text-sm text-slate-900">{suggestedCategory}</p>
                </div>
              )}

              {reasons.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Reasons</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-900">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {quickWins.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Quick wins</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-900">
                    {quickWins.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {outreachAngle.trim() !== '' && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Outreach angle</h3>
                  <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-slate-900">
                    {outreachAngle}
                  </div>
                </div>
              )}

              {(aiState || aiUpdatedAt) && (
                <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  {aiState && <span>State: {aiState}</span>}
                  {aiUpdatedAt && <span>Updated: {aiUpdatedAt}</span>}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
