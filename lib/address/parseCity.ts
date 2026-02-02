/**
 * Parse city from address when city column is empty.
 * NL format: "Street 123, 1234 AB City" - city typically after postcode.
 * Fallback: last comma-separated segment.
 */

export function parseCityFromAddress(address: string | null | undefined): string {
  if (!address || typeof address !== 'string') return ''
  const trimmed = address.trim()
  if (!trimmed) return ''
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return ''
  const last = parts[parts.length - 1] ?? ''
  const postcodeMatch = last.match(/^(\d{4}\s*[A-Za-z]{2})\s+(.+)$/)
  if (postcodeMatch) {
    const cityPart = postcodeMatch[2]?.trim()
    if (cityPart) return cityPart
  }
  if (parts.length > 1) return last
  return ''
}
