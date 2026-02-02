'use client'

import { useSearchParams } from 'next/navigation'
import BusinessesList from './BusinessesList'

export default function BusinessesPage() {
  const searchParams = useSearchParams()
  const view = searchParams?.get('view') ?? ''
  const initialStatus = view === 'found' ? 'pending,enriched' : 'all'

  return (
    <BusinessesList
      viewMode="found"
      title="Businesses"
      description="View and manage businesses. Select rows and enrich with Google Places data."
      initialStatus={initialStatus}
    />
  )
}
