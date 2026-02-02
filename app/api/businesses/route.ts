import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"

const SELECT_FIELDS =
  "id, name, address, phone, email, website, scan_status, google_types, primary_type, scan_last_at"

const VALID_PAGE_SIZES = [10, 25, 50] as const
const VALID_STATUSES = ["pending", "enriched", "scraped", "queued", "processing", "done", "error"] as const

export type BusinessRow = {
  id: string
  name: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  scan_status: string | null
  google_types: string[] | null
  primary_type: string | null
  scan_last_at: string | null
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
  const typeParam = searchParams.get("type")
  const typeFilter = typeParam != null ? String(typeParam).trim() : null
  const qParam = searchParams.get("q")
  const searchTerm = qParam != null ? String(qParam).trim() : null

  const offset = (page - 1) * pageSize

  let statusFilter: string[] | null = null
  if (statusParam && statusParam !== "all") {
    const parts = statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    const valid = parts.filter((s) => VALID_STATUSES.includes(s as (typeof VALID_STATUSES)[number]))
    if (valid.length > 0) statusFilter = valid
  }

  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from("businesses")
      .select(SELECT_FIELDS, { count: "exact" })
      .order("created_at", { ascending: false })

    if (statusFilter && statusFilter.length > 0) {
      query = query.in("scan_status", statusFilter)
    }

    if (typeFilter) {
      query = query.contains("google_types", [typeFilter])
    }

    if (searchTerm) {
      const escaped = searchTerm.replace(/[%_\\]/g, (c) => (c === "\\" ? "\\\\" : `\\${c}`))
      const pattern = `"%${escaped}%"`
      query = query.or(
        `name.ilike.${pattern},address.ilike.${pattern},city.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},website.ilike.${pattern}`
      )
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ data: [], page, pageSize, total: 0 })
      }
      console.error("[businesses GET]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      data: data ?? [],
      page,
      pageSize,
      total,
    })
  } catch (err) {
    console.error("[businesses GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
