import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"

const SELECT_FIELDS =
  "id, city, lat, lng, radius, source, status, attempts, last_error, created_at, processed_at, payload"

const VALID_PAGE_SIZES = [10, 25, 50] as const
const VALID_STATUSES = ["pending", "processing", "done", "error"] as const

function getDisplayLocation(item: {
  city: string | null
  lat: number | null
  lng: number | null
  payload?: Record<string, unknown> | null
}): string {
  if (item.city && String(item.city).trim()) {
    return String(item.city).trim()
  }
  const payload = item.payload
  if (payload && typeof payload === "object") {
    const label = payload.location_label
    if (label != null && String(label).trim()) return String(label).trim()
    const raw = payload.location_raw
    if (raw != null && String(raw).trim()) return String(raw).trim()
    const input = payload.location_input
    if (input != null && String(input).trim()) return String(input).trim()
  }
  if (
    item.lat != null &&
    item.lng != null &&
    !Number.isNaN(Number(item.lat)) &&
    !Number.isNaN(Number(item.lng))
  ) {
    return `${Number(item.lat).toFixed(4)},${Number(item.lng).toFixed(4)}`
  }
  return "—"
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSizeParam = searchParams.get("pageSize")
  const pageSize = VALID_PAGE_SIZES.includes(Number(pageSizeParam) as (typeof VALID_PAGE_SIZES)[number])
    ? (Number(pageSizeParam) as (typeof VALID_PAGE_SIZES)[number])
    : 25
  const statusParam = searchParams.get("status")
  const status =
    statusParam && statusParam !== "all" && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
      ? (statusParam as (typeof VALID_STATUSES)[number])
      : null

  const offset = (page - 1) * pageSize

  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from("scanpoints")
      .select(SELECT_FIELDS, { count: "exact" })
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) {
      console.error("[scanpoints GET]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = (data ?? []).map((item) => ({
      ...item,
      display_location: getDisplayLocation(item),
    }))

    const total = count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    })
  } catch (err) {
    console.error("[scanpoints GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
