import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

const WEBHOOK_URL = process.env.N8N_GENERATE_SCANPOINTS_WEBHOOK_URL
const PATCH_DELAY_MS = 2000

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "N8N_GENERATE_SCANPOINTS_WEBHOOK_URL not configured" },
      { status: 500 }
    )
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

  const locationStr = String(location).trim()
  const payload = {
    location: locationStr,
    radius,
    query: query || undefined,
    type: type || undefined,
    location_label: locationStr,
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text
      console.error("[scanpoints/generate] webhook error", res.status, preview)
      return NextResponse.json(
        {
          error: `Generator webhook failed: HTTP ${res.status}`,
          details: preview,
        },
        { status: 502 }
      )
    }

    let patched = 0
    try {
      await new Promise((r) => setTimeout(r, PATCH_DELAY_MS))
      const supabase = createSupabaseAdmin()
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const cityEmpty = "city.is.null,city.eq.''"
      let rows: { id: string }[] | null = null
      let selectError: { message: string } | null = null

      const baseQuery = () =>
        supabase
          .from("scanpoints")
          .select("id")
          .gte("created_at", since)
          .or(cityEmpty)

      const { data: withSource, error: err1 } = await baseQuery().eq(
        "source",
        "n8n_generator"
      )
      if (!err1 && withSource && withSource.length > 0) {
        rows = withSource
      } else {
        const { data: fallback, error: err2 } = await baseQuery()
        selectError = err2
        rows = fallback
      }
      if (selectError) {
        console.error("[scanpoints/generate] patch select error", selectError)
      } else if (rows && rows.length > 0) {
        const ids = rows.map((r) => r.id)
        const { data: updated, error: updateError } = await supabase
          .from("scanpoints")
          .update({ city: locationStr })
          .in("id", ids)
          .select("id")

        if (updateError) {
          console.error("[scanpoints/generate] patch update error", updateError)
        } else {
          patched = updated?.length ?? 0
        }
      }
    } catch (patchErr) {
      console.error("[scanpoints/generate] patch failed", patchErr)
    }

    return NextResponse.json({ ok: true, patched })
  } catch (err) {
    console.error("[scanpoints/generate] fetch failed", err)
    return NextResponse.json(
      {
        error: "Failed to reach generator webhook",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    )
  }
}
