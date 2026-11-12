import { addDays, daysBetween } from '@/lib/dates'

export function allocate(total: number, weights: Array<number>) {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (w / sum) * total)
  const base = raw.map(Math.floor)
  let remainder = total - base.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac)
  for (let k = 0; remainder > 0; k = (k + 1) % order.length) {
    base[order[k].i] += 1
    remainder -= 1
  }
  return base
}

export function dateRange(from: string, to: string) {
  const days = daysBetween(from, to)
  return Array.from({ length: days + 1 }, (_, i) => addDays(from, i))
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const TOURISM_SEASON: Record<string, number> = {
  '01': 1.3,
  '02': 1.1,
  '03': 1.0,
  '04': 0.9,
  '05': 0.45,
  '06': 0.4,
  '07': 0.5,
  '08': 0.55,
  '09': 0.8,
  '10': 1.3,
  '11': 1.4,
  '12': 1.5,
}

export function weekdayFactor(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 5 || day === 6 || day === 0 ? 1.25 : 0.9
}
