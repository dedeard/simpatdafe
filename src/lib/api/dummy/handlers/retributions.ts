import { TODAY, addDays, monthLabel } from '@/lib/dates'
import { tariffValue } from '@/lib/tax'
import type { TableQuery } from '../../resources/common'
import { CODE, revenueName } from '../../resources/reference'
import type { Skrd, SkrdInput, SkrdRow, SkrdStatus } from '../../resources/retributions'
import { docNo, filterValue, getDb, matches, paginate, type Db } from '../db'
import { assert, taxpayerNpwpd } from '../lookup'

function derive(s: Skrd): SkrdStatus {
  return s.status === 'issued' && s.dueDate < TODAY ? 'overdue' : s.status
}

function row(db: Db, s: Skrd): SkrdRow {
  return { ...s, status: derive(s), retributionName: revenueName(s.retributionCode), npwpd: taxpayerNpwpd(db, s.taxpayerId) }
}

function wastePrice(db: Db, tier: 'homestay' | 'resort' | 'restaurant') {
  return tariffValue(db.tariffs, `waste.${tier}`, TODAY)
}

export const retributionHandlers = {
  'skrd.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const code = filterValue(query, 'code')
    const status = filterValue(query, 'status')
    const period = filterValue(query, 'period')
    const filtered = db.skrd
      .filter((s) => !code || s.retributionCode === code)
      .filter((s) => !status || derive(s) === status)
      .filter((s) => !period || s.period.startsWith(period))
      .filter((s) => matches(`${s.id} ${s.payerName} ${taxpayerNpwpd(db, s.taxpayerId) ?? ''}`, query.q))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || b.id.localeCompare(a.id))
    const live = filtered.filter((s) => s.status !== 'cancelled')
    const stats = {
      issued: live.length,
      total: live.reduce((sum, s) => sum + s.total, 0),
      overdue: live.filter((s) => derive(s) === 'overdue').length,
    }
    const page = paginate(filtered, query, stats)
    return { ...page, rows: page.rows.map((s) => row(db, s)) }
  },

  'skrd.get': async (id: string) => {
    const db = await getDb()
    const s = db.skrd.find((x) => x.id === id)
    assert(s, 'SKRD tidak ditemukan.')
    return row(db, s)
  },

  'skrd.create': async (input: SkrdInput) => {
    const db = await getDb()
    assert(['4.1.02.01', '4.1.02.03', '4.1.02.05'].includes(input.retributionCode), 'Jenis retribusi tidak valid.')
    assert(input.taxpayerId || input.payerName.trim(), 'Isi penyetor: pilih WP atau ketik nama.')
    const taxpayer = input.taxpayerId ? db.taxpayerById.get(input.taxpayerId) : undefined
    assert(!input.taxpayerId || taxpayer, 'Wajib pajak tidak ditemukan.')
    assert(input.period, 'Periode wajib diisi.')
    assert(input.lines.length > 0, 'Minimal satu baris rincian.')
    const lines = input.lines.map((l) => {
      assert(l.description.trim() && l.quantity > 0 && l.unitPrice >= 0, 'Rincian tidak valid.')
      return { ...l, description: l.description.trim(), amount: Math.round(l.quantity * l.unitPrice) }
    })
    const total = lines.reduce((s, l) => s + l.amount, 0)
    assert(total > 0, 'Total harus lebih dari nol.')
    assert(input.dueDate >= TODAY, 'Jatuh tempo tidak boleh sebelum tanggal terbit.')
    const skrd: Skrd = {
      id: docNo(db, 'SKRD', TODAY),
      retributionCode: input.retributionCode,
      taxpayerId: taxpayer?.id,
      payerName: taxpayer?.name ?? input.payerName.trim(),
      payerAddress: taxpayer?.address ?? input.payerAddress.trim(),
      period: input.period,
      lines,
      total,
      issuedAt: TODAY,
      dueDate: input.dueDate,
      status: 'issued',
    }
    db.skrd.push(skrd)
    return { id: skrd.id }
  },

  'skrd.cancel': async (input: { id: string; reason: string }) => {
    const db = await getDb()
    const s = db.skrd.find((x) => x.id === input.id)
    assert(s, 'SKRD tidak ditemukan.')
    assert(s.status === 'issued', 'Hanya SKRD yang belum dibayar yang dapat dibatalkan.')
    assert(input.reason.trim(), 'Alasan pembatalan wajib diisi.')
    s.status = 'cancelled'
    s.cancelReason = input.reason.trim()
    return { id: s.id }
  },

  'skrd.wastePreview': async (period: string) => {
    const db = await getDb()
    assert(/^\d{4}-\d{2}$/.test(period), 'Periode tidak valid.')
    const active = db.wasteSubscribers.filter((w) => db.taxpayerById.get(w.taxpayerId)?.status === 'active')
    const issued = new Set(
      db.skrd.filter((s) => s.retributionCode === CODE.waste && s.period === period && s.status !== 'cancelled').map((s) => s.taxpayerId),
    )
    const pending = active.filter((w) => !issued.has(w.taxpayerId))
    return {
      period,
      subscribers: active.length,
      alreadyIssued: active.length - pending.length,
      toIssue: pending.length,
      total: pending.reduce((s, w) => s + wastePrice(db, w.tier), 0),
    }
  },

  'skrd.wasteIssue': async (period: string) => {
    const db = await getDb()
    assert(/^\d{4}-\d{2}$/.test(period), 'Periode tidak valid.')
    const active = db.wasteSubscribers.filter((w) => db.taxpayerById.get(w.taxpayerId)?.status === 'active')
    const issued = new Set(
      db.skrd.filter((s) => s.retributionCode === CODE.waste && s.period === period && s.status !== 'cancelled').map((s) => s.taxpayerId),
    )
    let count = 0
    let total = 0
    for (const w of active) {
      if (issued.has(w.taxpayerId)) continue
      const taxpayer = db.taxpayerById.get(w.taxpayerId)!
      const price = wastePrice(db, w.tier)
      db.skrd.push({
        id: docNo(db, 'SKRD', TODAY),
        retributionCode: CODE.waste,
        taxpayerId: taxpayer.id,
        payerName: taxpayer.name,
        payerAddress: taxpayer.address,
        period,
        lines: [
          { description: `Retribusi persampahan ${monthLabel(period)}`, quantity: 1, unit: 'bulan', unitPrice: price, amount: price },
        ],
        total: price,
        issuedAt: TODAY,
        dueDate: addDays(TODAY, 30),
        status: 'issued',
      })
      count += 1
      total += price
    }
    return { count, total }
  },
}
