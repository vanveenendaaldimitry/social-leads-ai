"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"

type SourceRow = Record<string, any>

export default function SourcesPage() {
  const [rows, setRows] = useState<SourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    setError(null)

    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      setRows([])
    } else {
      setRows((data as SourceRow[]) || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    let alive = true

    const run = async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .order("created_at", { ascending: false })

      if (!alive) return

      if (error) {
        setError(error.message)
        setRows([])
      } else {
        setRows((data as SourceRow[]) || [])
      }

      setLoading(false)
    }

    setLoading(true)
    run()

    const id = setInterval(run, 10000)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const columns = useMemo(() => {
    if (!rows.length) return []
    const keys = Object.keys(rows[0] ?? {})
    const preferred = ["name", "type", "status", "client_id", "created_at", "id"]
    const sorted = [
      ...preferred.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !preferred.includes(k)),
    ]
    return sorted.slice(0, 8)
  }, [rows])

  const content = useMemo(() => {
    if (loading) return <p className="text-neutral-400">Loading</p>

    if (error) {
      return (
        <div className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-red-200">
          Error {error}
        </div>
      )
    }

    if (!rows.length) return <p className="text-neutral-400">Geen records gevonden</p>

    return (
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-950">
            <tr className="text-neutral-300">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-neutral-900">
            {rows.map((r, idx) => (
              <tr key={r.id ?? idx} className="border-t border-neutral-800">
                {columns.map((c) => (
                  <td key={c} className="px-4 py-3 text-neutral-200">
                    {c === "created_at" && r[c]
                      ? new Date(r[c]).toLocaleString()
                      : typeof r[c] === "object" && r[c] !== null
                        ? JSON.stringify(r[c])
                        : String(r[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [loading, error, rows, columns])

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sources</h1>
          <p className="mt-2 text-neutral-400">
            Overzicht van alle bronnen. Deze lijst vult vanzelf zodra je n8n flow sources toevoegt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-neutral-400">
            {loading ? "Bezig" : `${rows.length} items`}
          </div>

          <button
            onClick={() => fetchSources(true)}
            disabled={refreshing}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 disabled:opacity-50"
          >
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-6">{content}</div>
    </div>
  )
}
