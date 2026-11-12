import { CURRENT_YEAR, DEMO_NOW, TODAY, daysBetween, monthKey, monthRange } from '@/lib/dates'
import { ticketPrice } from '@/lib/tax'
import type { DashboardData } from '../../resources/dashboard'
import { CHANNEL_LABEL } from '../../resources/payments'
import { REVENUE_LINES, SECTORS, revenueName } from '../../resources/reference'
import { overdueBills } from '../bills'
import { getDb, regionName } from '../db'
import { sectorOfTaxpayer } from '../lookup'

const LAST_YEAR_SAME_PERIOD = 45_870_000_000

export const dashboardHandlers = {
  'dashboard.get': async (): Promise<DashboardData> => {
    const db = await getDb()
    const year = String(CURRENT_YEAR)
    const paid = db.sspd.filter((s) => s.status === 'paid' && s.paidAt?.startsWith(year))

    const realizedByCode = new Map<string, number>()
    const monthly = new Map<string, { pajak: number; retribusi: number }>()
    const channels = new Map<string, { amount: number; transactions: number }>()
    const districts = new Map<string, number>()
    const category = new Map(REVENUE_LINES.map((l) => [l.code, l.category]))
    const taxCodes = new Set(REVENUE_LINES.filter((l) => l.category === 'pajak').map((l) => l.code))

    for (const s of paid) {
      realizedByCode.set(s.revenueCode, (realizedByCode.get(s.revenueCode) ?? 0) + s.amount)
      const key = monthKey(s.paidAt!)
      const m = monthly.get(key) ?? { pajak: 0, retribusi: 0 }
      m[category.get(s.revenueCode) ?? 'retribusi'] += s.amount
      monthly.set(key, m)
      if (s.channel) {
        const c = channels.get(s.channel) ?? { amount: 0, transactions: 0 }
        c.amount += s.amount
        c.transactions += 1
        channels.set(s.channel, c)
      }
      if (taxCodes.has(s.revenueCode) && s.taxpayerId) {
        const d = regionName(db, db.taxpayerById.get(s.taxpayerId)?.distrikId ?? '')
        districts.set(d, (districts.get(d) ?? 0) + s.amount)
      }
    }
    for (const s of db.sppt) {
      if (s.status !== 'paid' || !s.paidAt?.startsWith(year)) continue
      const o = db.pbbObjects.find((x) => x.nop === s.nop)
      if (o) districts.set(regionName(db, o.distrikId), (districts.get(regionName(db, o.distrikId)) ?? 0) + s.amount)
    }

    const monthKeys = monthRange(`${year}-01`, monthKey(TODAY))
    const sortedDistricts = [...districts.entries()].sort((a, b) => b[1] - a[1])
    const top = sortedDistricts.slice(0, 8)
    const rest = sortedDistricts.slice(8).reduce((s, [, v]) => s + v, 0)

    const recent = paid
      .filter((s) => s.bill.kind !== 'ticket' && s.bill.kind !== 'opsen')
      .sort((a, b) => b.paidAt!.localeCompare(a.paidAt!))
      .slice(0, 7)

    const overdue = overdueBills(db)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const period = '2026-10'
    const required = db.objects.filter((o) => o.reportingRequired && monthKey(o.startedAt) <= period)
    const reported = db.sptpd.filter((s) => s.period === period && (s.status === 'submitted' || s.status === 'verified'))

    const active = db.taxpayers.filter((t) => t.status === 'active')
    const sectorCounts = new Map<string, number>(SECTORS.map((s) => [s, 0]))
    for (const t of active) {
      const sector = sectorOfTaxpayer(db, t)
      sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1)
    }

    const visitors = db.tickets.reduce(
      (acc, t) => {
        for (const v of t.visitors) acc[v.category === 'mancanegara' ? 'foreign' : 'domestic'] += 1
        return acc
      },
      { foreign: 0, domestic: 0 },
    )

    return {
      fiscalYear: CURRENT_YEAR,
      asOf: DEMO_NOW,
      sources: REVENUE_LINES.map((l) => ({
        code: l.code,
        name: l.name,
        group: l.group,
        category: l.category,
        target:
          db.targets.find((t) => t.year === CURRENT_YEAR && t.code === l.code)?.revised ??
          db.targets.find((t) => t.year === CURRENT_YEAR && t.code === l.code)?.target ??
          0,
        realized: realizedByCode.get(l.code) ?? 0,
      })),
      monthly: monthKeys.map((key) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(key.slice(5)) - 1],
        ...(monthly.get(key) ?? { pajak: 0, retribusi: 0 }),
      })),
      districts: [
        ...top.map(([district, amount]) => ({ district, amount })),
        ...(rest > 0 ? [{ district: 'Distrik lainnya', amount: rest }] : []),
      ],
      channels: (['teller', 'va', 'qris', 'bendahara'] as const).map((c) => ({
        channel: c,
        label: CHANNEL_LABEL[c],
        ...(channels.get(c) ?? { amount: 0, transactions: 0 }),
      })),
      recentPayments: recent.map((s) => ({
        sspd: s.id,
        npwpd: db.taxpayerById.get(s.taxpayerId ?? '')?.npwpd ?? '-',
        taxpayer: s.payerName,
        revenue: revenueName(s.revenueCode),
        amount: s.amount,
        channel: s.channel ? CHANNEL_LABEL[s.channel] : '-',
        paidAt: s.paidAt!,
      })),
      overdue: overdue.map((b) => ({
        skpd: b.label,
        npwpd: db.taxpayerById.get(b.taxpayerId ?? '')?.npwpd ?? '-',
        taxpayer: b.payerName,
        revenue: revenueName(b.revenueCode),
        period: b.dueDate!.slice(0, 7),
        amount: b.amount,
        dueDate: b.dueDate!,
        daysOverdue: daysBetween(b.dueDate!, TODAY),
      })),
      overdueCount: overdueBills(db).length,
      overdueAmount: overdueBills(db).reduce((s, b) => s + b.amount, 0),
      tourism: {
        domestic: visitors.domestic,
        foreign: visitors.foreign,
        ratePerVisitor: ticketPrice('mancanegara', db.tariffs, TODAY),
        uptdCount: visitors.domestic + visitors.foreign,
        bludCount: [...db.bludCounts.values()].reduce((s, v) => s + v, 0),
      },
      compliance: { period: 'Oktober 2026', mustReport: required.length, reported: reported.length, dueDate: '2026-11-30' },
      taxpayers: {
        active: active.length,
        newThisMonth: db.taxpayers.filter((t) => t.status !== 'draft' && monthKey(t.registeredAt) === monthKey(TODAY)).length,
        bySector: [...sectorCounts.entries()].map(([sector, count]) => ({ sector, count })),
      },
      lastYearSamePeriod: LAST_YEAR_SAME_PERIOD,
    }
  },
}
