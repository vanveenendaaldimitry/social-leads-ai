import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("id")

    if (error) {
      console.error("[organizations GET]", error)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error("[organizations GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
