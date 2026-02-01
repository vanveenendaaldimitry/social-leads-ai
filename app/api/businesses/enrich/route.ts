import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"

const WEBHOOK_URL = process.env.N8N_BUSINESS_ENRICH_WEBHOOK_URL
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET
const CONCURRENCY = 3
const TIMEOUT_MS = 30_000

type Failure = { business_id: string; place_id?: string; reason: string }

async function callWebhook(
  placeId: string,
  businessId: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!WEBHOOK_URL) {
    return { ok: false, reason: "N8N_BUSINESS_ENRICH_WEBHOOK_URL not configured" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = WEBHOOK_SECRET
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ place_id: placeId }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text()
      const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text
      return { ok: false, reason: `HTTP ${res.status}: ${preview}` }
    }
    return { ok: true }
  } catch (err) {
    clearTimeout(timeout)
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: msg }
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "N8N_BUSINESS_ENRICH_WEBHOOK_URL not configured" },
      { status: 500 }
    )
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

  const uniqueIds = [...new Set(businessIds)]
  const requested = uniqueIds.length

  if (requested === 0) {
    return NextResponse.json({
      requested: 0,
      skipped_no_place_id: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
    })
  }

  try {
    const supabase = createSupabaseAdmin()
    const { data: rows, error } = await supabase
      .from("businesses")
      .select("id, place_id")
      .in("id", uniqueIds)

    if (error) {
      console.error("[businesses/enrich] fetch error", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const withPlaceId = (rows ?? []).filter(
      (r): r is { id: string; place_id: string } =>
        Boolean(r.place_id && String(r.place_id).trim())
    )
    const skippedNoPlaceId = uniqueIds.length - withPlaceId.length

    if (withPlaceId.length === 0) {
      return NextResponse.json({
        requested,
        skipped_no_place_id: skippedNoPlaceId,
        succeeded: 0,
        failed: 0,
        failures: [],
      })
    }

    const failures: Failure[] = []
    let succeeded = 0

    for (let i = 0; i < withPlaceId.length; i += CONCURRENCY) {
      const chunk = withPlaceId.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async ({ id, place_id }) => {
          const result = await callWebhook(place_id, id)
          if (result.ok) {
            succeeded++
          } else {
            failures.push({
              business_id: id,
              place_id,
              reason: result.reason ?? "Unknown error",
            })
          }
        })
      )
    }

    const failed = failures.length

    return NextResponse.json({
      requested,
      skipped_no_place_id: skippedNoPlaceId,
      succeeded,
      failed,
      failures,
    })
  } catch (err) {
    console.error("[businesses/enrich]", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
