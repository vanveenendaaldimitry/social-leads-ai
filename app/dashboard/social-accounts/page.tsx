"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"

type SocialAccount = {
  id: string
  client_id: string
  platform: string
  handle: string
  status: string | null
  created_at: string
}

export default function SocialAccountsPage() {
  const [rows, setRows] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
        setRows([])
      } else {
        setRows((data as SocialAccount[]) || [])
      }

      setLoading(false)
    }

    run()
  }, [])

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-neutral-400">Loading</p>
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-red-200">
          Error {error}
        </div>
      )
    }

    if (!rows.length) {
      return <p className="text-neutral-400">Geen records gevonden</p>
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-950">
            <tr className="text-neutral-300">
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Handle</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-900">
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="px-4 py-3 font-semibold">{r.platform}</td>
                <td className="px-4 py-3 text-neutral-200">@{r.handle}</td>
                <td className="px-4 py-3">
                  <span className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-200">
                    {r.status || "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [loading, error, rows])

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Social accounts</h1>
          <p className="mt-2 text-neutral-400">
            Overzicht van gekoppelde social accounts
          </p>
        </div>

        <div className="text-sm text-neutral-400">
          {loading ? "Bezig" : `${rows.length} items`}
        </div>
      </div>

      <div className="mt-6">{content}</div>
    </div>
  )
}
