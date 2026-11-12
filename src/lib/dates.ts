export const TODAY = '2026-11-12'
export const DEMO_NOW = '2026-11-12T08:30:00+09:00'
export const CURRENT_YEAR = 2026

const DAY_MS = 86_400_000

function parse(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`)
}

function fmt(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: string, days: number) {
  return fmt(new Date(parse(date).getTime() + days * DAY_MS))
}

export function addMonths(date: string, months: number) {
  const d = parse(date)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return fmt(d)
}

export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / DAY_MS)
}

export function monthKey(date: string) {
  return date.slice(0, 7)
}

export function endOfMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return fmt(new Date(Date.UTC(y, m, 0)))
}

export function nextMonthKey(key: string) {
  return monthKey(addMonths(`${key}-01`, 1))
}

export function monthsBetweenKeys(from: string, to: string) {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

export function monthsLate(due: string, today: string = TODAY) {
  if (today <= due) return 0
  const d = parse(due)
  const t = parse(today)
  let months = (t.getUTCFullYear() - d.getUTCFullYear()) * 12 + (t.getUTCMonth() - d.getUTCMonth())
  if (t.getUTCDate() > d.getUTCDate()) months += 1
  return Math.max(months, 1)
}

export function toIso(date: string, time = '08:00') {
  return `${date}T${time}:00+09:00`
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export function monthRange(from: string, to: string) {
  const keys: Array<string> = []
  for (let key = from; key <= to; key = nextMonthKey(key)) keys.push(key)
  return keys
}
