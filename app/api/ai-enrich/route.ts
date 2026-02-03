import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_AI_ENRICH_WEBHOOK_URL

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[ai-enrich] webhookUrl set =", !!WEBHOOK_URL)

  if (!WEBHOOK_URL || WEBHOOK_URL.trim() === "") {
    console.error("[ai-enrich] NEXT_PUBLIC_N8N_AI_ENRICH_WEBHOOK_URL missing or empty")
    return NextResponse.json(
      { error: "AI enrich webhook URL not configured" },
      { status: 500 }
    )
  }

  let body: { business_ids?: unknown; profile_key?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (body == null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawIds = body.business_ids
  if (!Array.isArray(rawIds)) {
    return NextResponse.json(
      { error: "business_ids must be an array of strings" },
      { status: 400 }
    )
  }

  const profileKey = typeof body.profile_key === "string" ? body.profile_key.trim() : ""
  if (profileKey === "") {
    return NextResponse.json(
      { error: "profile_key is required and must be a non-empty string" },
      { status: 400 }
    )
  }

  const businessIds = rawIds
    .map((id) => (typeof id === "string" ? id.trim() : null))
    .filter((id): id is string => Boolean(id))
  const uniqueIds = [...new Set(businessIds)]

  if (uniqueIds.length === 0) {
    return NextResponse.json(
      { error: "No valid business IDs provided", succeeded: 0, failed: 0 },
      { status: 400 }
    )
  }

  console.log("[ai-enrich] sending ids count =", uniqueIds.length)

  let succeeded = 0
  const failures: { business_id: string; status?: number; reason?: string }[] = []

  for (const business_id of uniqueIds) {
    const payload = { business_id, profile_key: profileKey }
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      })
      if (!res.ok) {
        const text = await res.text()
        const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text
        console.error("[ai-enrich] webhook call failed:", res.status, preview)
        failures.push({ business_id, status: res.status, reason: preview })
        continue
      }
      succeeded++
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error("[ai-enrich] webhook call error for", business_id, reason)
      failures.push({ business_id, reason })
    }
  }

  if (failures.length > 0) {
    return NextResponse.json(
      {
        error: `${failures.length} of ${uniqueIds.length} webhook call(s) failed`,
        succeeded,
        failed: failures.length,
        failures,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ succeeded, failed: 0 })
}
