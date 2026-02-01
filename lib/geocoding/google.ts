import "server-only"

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
const GEOCODE_TIMEOUT_MS = 8000

function isLatLng(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed) return false
  const parts = trimmed.split(",").map((p) => p.trim())
  if (parts.length !== 2) return false
  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

type GeocodeResult = {
  lat: number
  lng: number
  formatted_address?: string
}

export async function geocodeToLatLng(
  input: string
): Promise<GeocodeResult> {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error("Location is required")
  }

  if (isLatLng(trimmed)) {
    const parts = trimmed.split(",").map((p) => parseFloat(p.trim()))
    return { lat: parts[0], lng: parts[1] }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("Geocoding not configured: GOOGLE_MAPS_API_KEY required")
  }

  const url = `${GEOCODE_URL}?address=${encodeURIComponent(trimmed)}&key=${apiKey}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const text = await res.text()

    if (!res.ok) {
      const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text
      throw new Error(
        `Geocoding API error: HTTP ${res.status} - ${preview}`
      )
    }

    let data: {
      status: string
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } }; formatted_address?: string }>
      error_message?: string
    }
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error("Geocoding API did not return JSON")
    }

    if (data.status !== "OK") {
      const msg =
        data.error_message ?? data.status ?? "Geocoding failed"
      throw new Error(msg)
    }

    const results = data.results
    if (!results || results.length === 0) {
      const msg = data.error_message
        ? `No results: ${data.error_message}`
        : "No results found for this location"
      throw new Error(msg)
    }

    const first = results[0]
    const loc = first?.geometry?.location
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      throw new Error("Invalid geocoding response")
    }

    return {
      lat: loc.lat,
      lng: loc.lng,
      formatted_address: first?.formatted_address,
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Geocoding request timed out")
      }
      throw err
    }
    throw new Error("Geocoding failed")
  }
}
