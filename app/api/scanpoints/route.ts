import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"
import { geocodeToLatLng } from "@/lib/geocoding/google"

const SELECT_FIELDS =
  "id, city, lat, lng, radius, query, source, status, attempts, last_error, created_at, processed_at"

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

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)))
  const offset = (page - 1) * pageSize

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("scanpoints")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("[scanpoints GET]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data ?? [],
      page,
      pageSize,
    })
  } catch (err) {
    console.error("[scanpoints GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const location = body?.location
  if (location == null || location === "") {
    return NextResponse.json(
      { error: "location required" },
      { status: 400 }
    )
  }
  const locationRaw = String(location).trim()

  const radiusRaw = body?.radius
  const radius =
    radiusRaw === undefined || radiusRaw === null || radiusRaw === ""
      ? 3000
      : Math.floor(Number(radiusRaw))
  if (Number.isNaN(radius) || radius < 100 || radius > 50000) {
    return NextResponse.json(
      { error: "radius must be an integer between 100 and 50000" },
      { status: 400 }
    )
  }

  const query = body?.query != null ? String(body.query).trim() : ""
  const type = body?.type != null ? String(body.type).trim() : ""
  if (!query && !type) {
    return NextResponse.json(
      { error: "At least one of query or type must be provided" },
      { status: 400 }
    )
  }

  let lat: number
  let lng: number
  let city: string | null
  let geocoded: boolean
  let geocodedAddress: string | undefined

  try {
    const result = await geocodeToLatLng(locationRaw)
    lat = result.lat
    lng = result.lng
    geocoded = !isLatLng(locationRaw)
    geocodedAddress = result.formatted_address
    city = isLatLng(locationRaw) ? null : locationRaw
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocoding failed"
    console.error("[scanpoints POST] geocoding", err)
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }

  const payload: Record<string, unknown> = {
    location_raw: locationRaw,
    geocoded,
    radius_m: radius,
  }
  if (geocodedAddress) payload.geocoded_address = geocodedAddress
  if (type) payload.type = type
  if (query) payload.query = query

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("scanpoints")
      .insert({
        city,
        lat,
        lng,
        radius,
        query: query || null,
        source: "dashboard",
        status: "pending",
        payload,
      })
      .select()
      .single()

    if (error) {
      console.error("[scanpoints POST]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[scanpoints POST]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
