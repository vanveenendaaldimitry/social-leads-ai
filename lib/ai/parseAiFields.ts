/**
 * Normalize ai_reasons and ai_quick_wins for display.
 * Handles jsonb, JSON string, or plain string.
 */

export function parseAiList(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v : String(v ?? ''))).filter(Boolean)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map((v) => (typeof v === 'string' ? v : String(v ?? ''))).filter(Boolean)
      }
      return [trimmed]
    } catch {
      return [trimmed]
    }
  }
  return []
}
