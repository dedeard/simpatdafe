import { DEMO_NOW, TODAY, addDays, daysBetween } from '@/lib/dates'
import { ticketPrice } from '@/lib/tax'
import type { TableQuery } from '../../resources/common'
import { CODE } from '../../resources/reference'
import type { EntryCategory, EntryTicket, ReconciliationRow, TicketInput, TicketRow } from '../../resources/tourism'
import { openSspd, type Bill } from '../bills'
import { docNo, filterValue, getDb, matches, paginate } from '../db'
import { assert } from '../lookup'

function mixOf(t: EntryTicket): Record<EntryCategory, number> {
  const mix = { mancanegara: 0, domestik: 0, lokal: 0 }
  for (const v of t.visitors) mix[v.category] += 1
  return mix
}

function toRow(t: EntryTicket): TicketRow {
  return {
    id: t.id,
    leader: t.visitors[0]?.name ?? '-',
    count: t.visitors.length,
    mix: mixOf(t),
    total: t.total,
    channel: t.channel,
    point: t.point,
    soldAt: t.soldAt,
  }
}

export const tourismHandlers = {
  'tourism.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const from = filterValue(query, 'from')
    const to = filterValue(query, 'to')
    const point = filterValue(query, 'point')
    const channel = filterValue(query, 'channel')
    const category = filterValue(query, 'category')
    const filtered = db.tickets
      .filter((t) => !point || t.point === point)
      .filter((t) => !channel || t.channel === channel)
      .filter((t) => !category || t.visitors.some((v) => v.category === category))
      .filter((t) => (!from || t.soldAt.slice(0, 10) >= from) && (!to || t.soldAt.slice(0, 10) <= to))
      .filter((t) => matches(`${t.id} ${t.visitors[0]?.name ?? ''}`, query.q))
    const mix = { mancanegara: 0, domestik: 0, lokal: 0 }
    let visitors = 0
    let amount = 0
    for (const t of filtered) {
      visitors += t.visitors.length
      amount += t.total
      const m = mixOf(t)
      mix.mancanegara += m.mancanegara
      mix.domestik += m.domestik
      mix.lokal += m.lokal
    }
    const sorted = filtered.sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    const page = paginate(sorted, query, { tickets: filtered.length, visitors, amount, mix })
    return { ...page, rows: page.rows.map(toRow) }
  },

  'tourism.get': async (id: string) => {
    const db = await getDb()
    const t = db.tickets.find((x) => x.id === id)
    assert(t, 'Tiket tidak ditemukan.')
    return {
      ...t,
      tariffs: {
        mancanegara: ticketPrice('mancanegara', db.tariffs, t.validFrom),
        domestik: ticketPrice('domestik', db.tariffs, t.validFrom),
        lokal: ticketPrice('lokal', db.tariffs, t.validFrom),
      },
    }
  },

  'tourism.create': async (input: TicketInput) => {
    const db = await getDb()
    assert(input.visitors.length >= 1 && input.visitors.length <= 20, 'Jumlah pengunjung 1–20 orang.')
    const visitors = input.visitors.map((v) => {
      assert(v.name.trim(), 'Nama pengunjung wajib diisi.')
      const category: EntryCategory = v.nationality === 'ID' ? (v.category === 'lokal' ? 'lokal' : 'domestik') : 'mancanegara'
      if (category === 'mancanegara') assert(v.idNumber.trim().length >= 6, `Nomor paspor ${v.name} tidak valid.`)
      else assert(/^\d{16}$/.test(v.idNumber), `NIK ${v.name} harus 16 digit.`)
      return { ...v, name: v.name.trim(), category }
    })
    const total = visitors.reduce((s, v) => s + ticketPrice(v.category, db.tariffs, TODAY), 0)
    const ticket: EntryTicket = {
      id: docNo(db, 'TKT', TODAY),
      point: input.point,
      visitors,
      total,
      validFrom: TODAY,
      validUntil: addDays(TODAY, 365),
      channel: input.channel,
      sspdId: '',
      soldAt: DEMO_NOW,
      officer: 'Admin Demo',
    }
    db.tickets.push(ticket)
    if (total > 0) {
      const bill: Bill = {
        ref: { kind: 'ticket', id: ticket.id },
        label: `Tiket wisata · ${ticket.id}`,
        payerName: visitors[0].name,
        revenueCode: CODE.tourism,
        amount: total,
        paid: false,
        payable: true,
      }
      const sspd = openSspd(db, bill, DEMO_NOW, {
        channel: input.channel === 'tunai' ? 'bendahara' : input.channel,
        paidAt: DEMO_NOW,
        bankRef: `TKT${ticket.id.slice(-6)}`,
        reconciled: false,
      })
      ticket.sspdId = sspd.id
    }
    return { id: ticket.id }
  },

  'tourism.reconciliation': async (input: { from: string; to: string }): Promise<Array<ReconciliationRow>> => {
    const db = await getDb()
    assert(input.from <= input.to && daysBetween(input.from, input.to) <= 366, 'Rentang tanggal tidak valid.')
    const uptd = new Map<string, number>()
    for (const t of db.tickets) {
      const day = t.soldAt.slice(0, 10)
      if (day >= input.from && day <= input.to) uptd.set(day, (uptd.get(day) ?? 0) + t.visitors.length)
    }
    const price = ticketPrice('mancanegara', db.tariffs, TODAY)
    const rows: Array<ReconciliationRow> = []
    for (let i = 0; i <= daysBetween(input.from, input.to); i++) {
      const date = addDays(input.from, i)
      const u = uptd.get(date) ?? 0
      const b = db.bludCounts.get(date) ?? 0
      const gap = u - b
      rows.push({
        date,
        uptd: u,
        blud: b,
        gap,
        gapPct: u === 0 ? 0 : gap / u,
        potential: gap > 0 ? gap * price : 0,
        checkedNote: db.checkedDays.get(date),
      })
    }
    return rows
  },

  'tourism.markChecked': async (input: { date: string; note: string }) => {
    const db = await getDb()
    assert(input.note.trim(), 'Catatan pengecekan wajib diisi.')
    db.checkedDays.set(input.date, input.note.trim())
    return { date: input.date }
  },
}
