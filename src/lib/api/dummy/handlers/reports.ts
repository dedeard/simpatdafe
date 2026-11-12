import { TODAY, daysBetween, monthKey, monthRange } from '@/lib/dates'
import type { Channel, SspdRow } from '../../resources/payments'
import { REVENUE_LINES, revenueName } from '../../resources/reference'
import type { DailyReport, PerWpRow, PiutangReport, Realisasi, RealisasiRow } from '../../resources/reports'
import { overdueBills } from '../bills'
import { getDb, regionName } from '../db'
import { assert, sspdStatus, taxpayerNpwpd } from '../lookup'

export const reportHandlers = {
  'reports.realisasi': async (input: { year: number; month: number }): Promise<Realisasi> => {
    const db = await getDb()
    assert(input.month >= 1 && input.month <= 12, 'Bulan tidak valid.')
    const current = `${input.year}-${String(input.month).padStart(2, '0')}`
    const sums = new Map<string, { previous: number; current: number }>()
    for (const s of db.sspd) {
      if (s.status !== 'paid' || !s.paidAt) continue
      const key = monthKey(s.paidAt)
      if (!key.startsWith(String(input.year)) || key > current) continue
      const entry = sums.get(s.revenueCode) ?? { previous: 0, current: 0 }
      if (key === current) entry.current += s.amount
      else entry.previous += s.amount
      sums.set(s.revenueCode, entry)
    }
    const rows: Array<RealisasiRow> = REVENUE_LINES.map((line) => {
      const target = db.targets.find((t) => t.year === input.year && t.code === line.code)
      const entry = sums.get(line.code) ?? { previous: 0, current: 0 }
      return {
        code: line.code,
        name: line.name,
        group: line.group,
        category: line.category,
        target: target?.revised ?? target?.target ?? 0,
        previous: entry.previous,
        current: entry.current,
        cumulative: entry.previous + entry.current,
      }
    })
    return { year: input.year, month: input.month, rows, thisYearLabel: current }
  },

  'reports.daily': async (input: { date: string; channel?: string }): Promise<DailyReport> => {
    const db = await getDb()
    assert(/^\d{4}-\d{2}-\d{2}$/.test(input.date), 'Tanggal tidak valid.')
    const rows = db.sspd
      .filter(
        (s) =>
          s.status === 'paid' &&
          s.paidAt?.startsWith(input.date) &&
          (!input.channel || input.channel === 'all' || s.channel === input.channel),
      )
      .sort((a, b) => a.paidAt!.localeCompare(b.paidAt!))
    const byChannel: Record<Channel, number> = { teller: 0, va: 0, qris: 0, bendahara: 0 }
    for (const s of rows) if (s.channel) byChannel[s.channel] += s.amount
    return {
      date: input.date,
      rows: rows.slice(0, 500).map((s): SspdRow => ({
        ...s,
        status: sspdStatus(s),
        revenueName: revenueName(s.revenueCode),
        npwpd: taxpayerNpwpd(db, s.taxpayerId),
      })),
      total: rows.reduce((sum, s) => sum + s.amount, 0),
      byChannel,
    }
  },

  'reports.perWp': async (input: { year: number; taxCode?: string; distrikId?: string }): Promise<Array<PerWpRow>> => {
    const db = await getDb()
    const paid = new Map<string, number>()
    for (const s of db.sspd) {
      if (s.status !== 'paid' || !s.taxpayerId || !s.paidAt?.startsWith(String(input.year))) continue
      if (input.taxCode && s.revenueCode !== input.taxCode) continue
      paid.set(s.taxpayerId, (paid.get(s.taxpayerId) ?? 0) + s.amount)
    }
    const arrears = new Map<string, number>()
    for (const b of overdueBills(db)) if (b.taxpayerId) arrears.set(b.taxpayerId, (arrears.get(b.taxpayerId) ?? 0) + b.amount)

    const lastDue = `${input.year}-12` < '2026-10' ? `${input.year}-12` : '2026-10'
    const reported = new Map<string, Set<string>>()
    for (const s of db.sptpd) {
      if (s.status !== 'verified' && s.status !== 'submitted') continue
      if (!s.period.startsWith(String(input.year))) continue
      if (input.taxCode && s.taxCode !== input.taxCode) continue
      const set = reported.get(s.taxpayerId) ?? new Set<string>()
      set.add(`${s.objectId}:${s.period}`)
      reported.set(s.taxpayerId, set)
    }
    const due = new Map<string, number>()
    for (const o of db.objects) {
      if (!o.reportingRequired) continue
      if (input.taxCode && o.taxCode !== input.taxCode) continue
      const start = monthKey(o.startedAt) > `${input.year}-01` ? monthKey(o.startedAt) : `${input.year}-01`
      const count = start > lastDue ? 0 : monthRange(start, lastDue).length
      due.set(o.taxpayerId, (due.get(o.taxpayerId) ?? 0) + count)
    }

    return [...paid.entries()]
      .map(([id, amount]) => ({ id, amount, t: db.taxpayerById.get(id) }))
      .filter((x) => x.t && (!input.distrikId || x.t.distrikId === input.distrikId))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 50)
      .map(({ id, amount, t }) => ({
        taxpayerId: id,
        npwpd: t!.npwpd ?? '-',
        name: t!.name,
        distrik: regionName(db, t!.distrikId),
        paid: amount,
        monthsReported: reported.get(id)?.size ?? 0,
        monthsDue: due.get(id) ?? 0,
        arrears: arrears.get(id) ?? 0,
      }))
  },

  'reports.piutang': async (): Promise<PiutangReport> => {
    const db = await getDb()
    const bills = overdueBills(db)
    const bucketOf = (d: number) => (d <= 30 ? 0 : d <= 90 ? 1 : d <= 180 ? 2 : 3)
    const names = ['1–30 hari', '31–90 hari', '91–180 hari', '> 180 hari']
    const buckets = names.map((bucket) => ({ bucket, count: 0, amount: 0 }))
    const byTax = new Map<string, { name: string; buckets: Array<number>; total: number }>()
    const byDistrik = new Map<string, number>()
    for (const b of bills) {
      const days = daysBetween(b.dueDate!, TODAY)
      const i = bucketOf(days)
      buckets[i].count += 1
      buckets[i].amount += b.amount
      const tax = byTax.get(b.revenueCode) ?? { name: revenueName(b.revenueCode), buckets: [0, 0, 0, 0], total: 0 }
      tax.buckets[i] += b.amount
      tax.total += b.amount
      byTax.set(b.revenueCode, tax)
      const d = b.distrikId ? regionName(db, b.distrikId) : 'Tidak diketahui'
      byDistrik.set(d, (byDistrik.get(d) ?? 0) + b.amount)
    }
    return {
      asOf: TODAY,
      buckets,
      byTax: [...byTax.values()].sort((a, b) => b.total - a.total),
      byDistrik: [...byDistrik.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      rows: bills
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 25)
        .map((b) => ({
          label: b.label,
          payer: b.payerName,
          revenue: revenueName(b.revenueCode),
          amount: b.amount,
          daysLate: daysBetween(b.dueDate!, TODAY),
        })),
    }
  },
}
