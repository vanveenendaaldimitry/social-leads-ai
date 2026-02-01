import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"

const WEBHOOK_URL = process.env.N8N_SCANPOINT_WEBHOOK_URL

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "N8N_SCANPOINT_WEBHOOK_URL not configured" },
      { status: 500 }
    )
  }

  let body: { scanpoint_id?: string }
  try {
    body = (await request.json()) ?? {}
  } catch {
    body = {}
  }

  const scanpointId = body?.scanpoint_id

  const payload = scanpointId
    ? { mode: "id" as const, scanpoint_id: String(scanpointId) }
    : { mode: "next" as const }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }

    if (!res.ok) {
      console.error("[scanpoints/run] n8n error", res.status, text)
      return NextResponse.json(
        { error: "n8n webhook failed", details: data },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[scanpoints/run] fetch failed", err)
    return NextResponse.json(
      {
        error: "Failed to reach n8n webhook",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    )
  }
}
