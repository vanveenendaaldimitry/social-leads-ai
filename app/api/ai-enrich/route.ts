import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_AI_ENRICH_WEBHOOK_URL
const CONCURRENCY = 5
const TIMEOUT_MS = 30_000

async function callWebhook(businessId: string): Promise<{ ok: boolean; error?: string }> {
  if (!WEBHOOK_URL) {
    return { ok: false, error: "NEXT_PUBLIC_N8N_AI_ENRICH_WEBHOOK_URL not configured" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: businessId,
        profile_key: "website_leadgen",
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const text = await res.text()
      const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text
      return { ok: false, error: `HTTP ${res.status}: ${preview}` }
    }
    return { ok: true }
  } catch (err) {
    clearTimeout(timeout)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_N8N_AI_ENRICH_WEBHOOK_URL not configured" },
      { status: 500 }
    )
  }

  let body: { businessIds?: unknown }
  try {
    body = (await request.json()) ?? {}
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawIds = body?.businessIds
  if (!Array.isArray(rawIds)) {
    return NextResponse.json({ error: "businessIds must be an array of strings" }, { status: 400 })
  }

  const ids = rawIds
    .map((id) => (typeof id === "string" ? id.trim() : null))
    .filter((id): id is string => Boolean(id))
  const uniqueIds = [...new Set(ids)]

  if (uniqueIds.length === 0) {
    return NextResponse.json({ error: "businessIds cannot be empty" }, { status: 400 })
  }

  const started: string[] = []
  const failed: { business_id: string; error: string }[] = []

  for (let i = 0; i < uniqueIds.length; i += CONCURRENCY) {
    const chunk = uniqueIds.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      chunk.map(async (id) => {
        const result = await callWebhook(id)
        if (result.ok) started.push(id)
        else failed.push({ business_id: id, error: result.error ?? "Unknown error" })
      })
    )
    void results
  }

  return NextResponse.json({ started, failed })
}
