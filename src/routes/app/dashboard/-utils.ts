import type { DashboardData, RevenueCategory, RevenueSource } from '@/lib/api/resources'

export function sum<T>(items: Array<T>, pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function ratio(part: number, whole: number) {
  return whole === 0 ? 0 : part / whole
}

export function totalsFor(sources: Array<RevenueSource>, category?: RevenueCategory) {
  const scoped = category ? sources.filter((s) => s.category === category) : sources
  return { target: sum(scoped, (s) => s.target), realized: sum(scoped, (s) => s.realized) }
}

export function summarize(data: DashboardData) {
  const all = totalsFor(data.sources)
  const current = data.monthly.at(-1)
  const previous = data.monthly.at(-2)
  const monthTotal = (m?: { pajak: number; retribusi: number }) => (m ? m.pajak + m.retribusi : 0)
  return {
    all,
    pajak: totalsFor(data.sources, 'pajak'),
    retribusi: totalsFor(data.sources, 'retribusi'),
    thisMonth: monthTotal(current),
    lastMonth: monthTotal(previous),
    thisMonthLabel: current?.month ?? '',
    lastMonthLabel: previous?.month ?? '',
    yoyGrowth: ratio(all.realized - data.lastYearSamePeriod, data.lastYearSamePeriod),
    overdueTotal: sum(data.overdue, (o) => o.amount),
  }
}

export type DashboardSummary = ReturnType<typeof summarize>
