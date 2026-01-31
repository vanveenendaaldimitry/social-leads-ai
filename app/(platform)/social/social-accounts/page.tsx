"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

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
      return <p className="text-slate-500">Loading</p>
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          Error {error}
        </div>
      )
    }

    if (!rows.length) {
      return <p className="text-slate-500">Geen records gevonden</p>
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-600">
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Handle</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                <td className="px-4 py-3 font-semibold text-slate-800">{r.platform}</td>
                <td className="px-4 py-3 text-slate-600">@{r.handle}</td>
                <td className="px-4 py-3">
                  <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                    {r.status || "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
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
          <h1 className="text-2xl font-bold text-slate-900">Social accounts</h1>
          <p className="mt-2 text-slate-600">
            Overzicht van gekoppelde social accounts
          </p>
        </div>

        <div className="text-sm font-medium text-slate-500">
          {loading ? "Bezig" : `${rows.length} items`}
        </div>
      </div>

      <div className="mt-8">{content}</div>
    </div>
  )
}
