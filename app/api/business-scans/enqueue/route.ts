import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"

/**
 * Index recommendation for business_scans:
 * Create a unique partial index to ensure only one active scan exists per business:
 *
 *   CREATE UNIQUE INDEX idx_business_scans_one_active_per_business
 *   ON public.business_scans (business_id)
 *   WHERE status IN ('queued', 'processing');
 *
 * This prevents duplicate enqueues and enforces the "skip if already active" logic at the DB level.
 * If migrations are not part of this repo, run this manually in Supabase SQL editor.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { business_ids?: unknown }
  try {
    body = (await request.json()) ?? {}
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawIds = body?.business_ids
  if (!Array.isArray(rawIds)) {
    return NextResponse.json(
      { error: "business_ids must be an array of strings" },
      { status: 400 }
    )
  }

  const businessIds = rawIds
    .map((id) => (typeof id === "string" ? id.trim() : null))
    .filter((id): id is string => Boolean(id))

  if (businessIds.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0 })
  }

  const uniqueIds = [...new Set(businessIds)]

  try {
    const supabase = createSupabaseAdmin()

    const { data: activeScans } = await supabase
      .from("business_scans")
      .select("business_id")
      .in("business_id", uniqueIds)
      .in("status", ["queued", "processing"])

    const alreadyActive = new Set((activeScans ?? []).map((r) => r.business_id))
    const toInsert = uniqueIds.filter((id) => !alreadyActive.has(id))

    let insertedCount = 0
    if (toInsert.length > 0) {
      const rows = toInsert.map((business_id) => ({
        business_id,
        status: "queued",
        provider: "dashboard",
        requested_by: user.id,
      }))

      const { data: insertedRows, error: insertError } = await supabase
        .from("business_scans")
        .insert(rows)
        .select("id")

      if (insertError) {
        console.error("[business-scans/enqueue] insert error", insertError)
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      }

      insertedCount = insertedRows?.length ?? 0

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ scan_status: "queued" })
        .in("id", toInsert)

      if (updateError) {
        console.error("[business-scans/enqueue] update businesses error", updateError)
      }
    }

    const skipped = uniqueIds.length - insertedCount

    return NextResponse.json({ inserted: insertedCount, skipped })
  } catch (err) {
    console.error("[business-scans/enqueue]", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
