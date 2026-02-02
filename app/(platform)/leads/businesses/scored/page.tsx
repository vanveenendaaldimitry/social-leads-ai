'use client'

import BusinessesList from '../BusinessesList'

export default function ScoredPage() {
  return (
    <BusinessesList
      viewMode="scored"
      title="Scored businesses"
      description="Completed businesses with enrichment and scoring. Click a row to open its dashboard."
    />
  )
}
