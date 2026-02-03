/**
 * Format business address from structured fields with safe fallbacks.
 *
 * Rules:
 * - Build "street, postal city" from address_street, address_postal_code, address_city
 * - Append country if not already present (case insensitive)
 * - If both street and city are empty, fall back to full address string
 * - If everything is empty, return empty string
 */
export type AddressLike = {
  address_street?: string | null
  address_postal_code?: string | null
  address_city?: string | null
  address_country?: string | null
  address?: string | null
}

export function formatBusinessAddress(b: AddressLike): string {
  const street = (b.address_street ?? '').trim()
  const postal = (b.address_postal_code ?? '').trim()
  const city = (b.address_city ?? '').trim()
  let country = (b.address_country ?? '').trim()

  const hasStreet = street.length > 0
  const hasCity = city.length > 0

  // Fallback: if both street and city are empty, use full address string
  if (!hasStreet && !hasCity) {
    const full = (b.address ?? '').trim()
    return full
  }

  const parts: string[] = []

  if (hasStreet) {
    parts.push(street)
  }

  const secondParts: string[] = []
  if (postal.length > 0) secondParts.push(postal)
  if (hasCity) secondParts.push(city)
  if (secondParts.length > 0) {
    parts.push(secondParts.join(' '))
  }

  let result = parts.join(', ').trim()

  if (country.length > 0) {
    // Normalize common Dutch variants
    const lowerCountry = country.toLowerCase()
    if (lowerCountry === 'nederland' || lowerCountry === 'the netherlands') {
      country = 'Netherlands'
    }

    const lower = result.toLowerCase()
    if (!lower.includes(country.toLowerCase())) {
      result = result ? `${result}, ${country}` : country
    }
  }

  return result
}

