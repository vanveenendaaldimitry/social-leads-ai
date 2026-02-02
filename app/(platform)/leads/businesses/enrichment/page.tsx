'use client'

import BusinessesList from '../BusinessesList'

export default function EnrichmentPage() {
  return (
    <BusinessesList
      viewMode="enrichment"
      title="Enrichment"
      description="Businesses ready for enrichment. Select rows to enrich, or click a row to open its dashboard."
    />
  )
}
