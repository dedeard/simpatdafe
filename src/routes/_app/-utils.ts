import type { TableQuery } from '@/lib/api/resources'

export function parseTableSearch(search: Record<string, unknown>): TableQuery {
  const out: TableQuery = {}
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    if (key === 'page' || key === 'pageSize') {
      const n = Number(value)
      if (Number.isFinite(n) && n > 0) out[key] = Math.floor(n)
    } else if (typeof value === 'string' || typeof value === 'number') {
      out[key] = value
    }
  }
  return out
}

export function toOptions<T extends string>(map: Record<T, string>) {
  return (Object.keys(map) as Array<T>).map((value) => ({ value, label: map[value] }))
}

export function todayLocal() {
  return '2026-11-12'
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function numberFrom(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
