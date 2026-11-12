import { DEMO_NOW, TODAY } from '@/lib/dates'
import type { BillKind, BillRef, TableQuery } from '../../resources/common'
import type { BankStatementRow, BillOption, Channel, Reconciliation, Sspd, SspdRow } from '../../resources/payments'
import { revenueName } from '../../resources/reference'
import { billOf, ensureBill, markBillPaid, openSspd } from '../bills'
import { fail, filterValue, getDb, matches, paginate, type Db } from '../db'
import { assert, isoNow, sspdStatus, taxpayerNpwpd } from '../lookup'

function row(db: Db, s: Sspd): SspdRow {
  return { ...s, status: sspdStatus(s), revenueName: revenueName(s.revenueCode), npwpd: taxpayerNpwpd(db, s.taxpayerId) }
}

function requireSspd(db: Db, id: string) {
  const s = db.sspd.find((x) => x.id === id)
  assert(s, 'SSPD tidak ditemukan.')
  return s
}

function billRefs(db: Db, kind: BillKind): Array<BillRef> {
  switch (kind) {
    case 'sptpd':
      return db.sptpd.filter((s) => s.status === 'verified' && !s.paidAt).map((s) => ({ kind, id: s.id }))
    case 'skpd':
      return db.assessments.filter((a) => a.status === 'issued').map((a) => ({ kind, id: a.id }))
    case 'stpd':
      return db.stpd.filter((s) => s.status !== 'paid').map((s) => ({ kind, id: s.id }))
    case 'skrd':
      return db.skrd.filter((s) => s.status === 'issued').map((s) => ({ kind, id: s.id }))
    case 'sppt':
      return db.sppt.filter((s) => s.status === 'issued' && s.amount > 0).map((s) => ({ kind, id: `${s.nop}@${s.year}` }))
    case 'bphtb':
      return db.bphtb.filter((b) => b.status === 'verified').map((b) => ({ kind, id: b.id }))
    case 'port':
      return db.portBills.filter((p) => p.status === 'unpaid').map((p) => ({ kind, id: p.id }))
    default:
      return []
  }
}

export const paymentHandlers = {
  'payments.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const from = filterValue(query, 'from')
    const to = filterValue(query, 'to')
    const channel = filterValue(query, 'channel')
    const status = filterValue(query, 'status')
    const revenue = filterValue(query, 'revenue')
    const filtered = db.sspd
      .filter((s) => !channel || s.channel === channel)
      .filter((s) => !status || sspdStatus(s) === status)
      .filter((s) => !revenue || s.revenueCode === revenue)
      .filter((s) => {
        const date = (s.paidAt ?? s.createdAt).slice(0, 10)
        return (!from || date >= from) && (!to || date <= to)
      })
      .filter((s) => matches(`${s.id} ${s.paymentCode} ${s.payerName} ${s.bankRef ?? ''}`, query.q))
      .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt))
    const paid = filtered.filter((s) => s.status === 'paid')
    const pending = filtered.filter((s) => sspdStatus(s) === 'pending')
    const stats = {
      received: paid.reduce((sum, s) => sum + s.amount, 0),
      count: paid.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, s) => sum + s.amount, 0),
    }
    const page = paginate(filtered, query, stats)
    return { ...page, rows: page.rows.map((s) => row(db, s)) }
  },

  'payments.get': async (id: string) => {
    const db = await getDb()
    const s = requireSspd(db, id)
    const bill = billOf(db, s.bill)
    return { sspd: row(db, s), billLabel: bill?.label ?? s.description, outstanding: bill && !bill.paid ? bill.amount : 0 }
  },

  'payments.billsFor': async (input: { kind: BillKind; q?: string }): Promise<Array<BillOption>> => {
    const db = await getDb()
    const options: Array<BillOption> = []
    for (const ref of billRefs(db, input.kind)) {
      const bill = billOf(db, ref)
      if (!bill || !bill.payable || bill.paid) continue
      if (!matches(`${bill.label} ${bill.payerName}`, input.q)) continue
      options.push({ ref, label: bill.label, payerName: bill.payerName, amount: bill.amount, revenueCode: bill.revenueCode })
      if (options.length >= 25) break
    }
    return options
  },

  'payments.createCode': async (ref: BillRef) => {
    const db = await getDb()
    const bill = ensureBill(db, ref)
    assert(bill.payable, 'Tagihan ini belum dapat dibayar (belum diverifikasi atau diterbitkan).')
    assert(!bill.paid, 'Tagihan sudah lunas.')
    const existing = db.sspd.find((s) => s.bill.kind === ref.kind && s.bill.id === ref.id && sspdStatus(s) === 'pending')
    if (existing) return row(db, existing)
    return row(db, openSspd(db, bill, DEMO_NOW))
  },

  'payments.record': async (input: { id: string; channel: Channel; paidAt: string; bankRef: string; amount: number }) => {
    const db = await getDb()
    const s = requireSspd(db, input.id)
    const status = sspdStatus(s)
    assert(status === 'pending', status === 'expired' ? 'Kode bayar sudah kedaluwarsa, buat kode baru.' : 'SSPD ini tidak dapat dibayar.')
    assert(input.amount === s.amount, `Jumlah harus sama dengan tagihan (Rp${s.amount.toLocaleString('id-ID')}).`)
    assert(input.bankRef.trim(), 'Nomor referensi bank wajib diisi.')
    const paidAt = isoNow(input.paidAt)
    assert(paidAt <= DEMO_NOW, 'Waktu pembayaran tidak boleh di masa depan.')
    s.status = 'paid'
    s.channel = input.channel
    s.paidAt = paidAt
    s.bankRef = input.bankRef.trim()
    s.reconciled = false
    markBillPaid(db, s.bill, s.id, paidAt)
    return { id: s.id }
  },

  'payments.void': async (input: { id: string; reason: string }) => {
    const db = await getDb()
    const s = requireSspd(db, input.id)
    assert(s.status === 'pending', 'Hanya SSPD yang menunggu bayar yang dapat dibatalkan.')
    assert(input.reason.trim(), 'Alasan pembatalan wajib diisi.')
    s.status = 'void'
    s.voidReason = input.reason.trim()
    return { id: s.id }
  },

  'payments.reconciliation': async (date: string): Promise<Reconciliation> => {
    const db = await getDb()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Tanggal tidak valid.')
    const paid = db.sspd.filter((s) => s.status === 'paid' && s.paidAt?.startsWith(date)).sort((a, b) => a.paidAt!.localeCompare(b.paidAt!))
    const limited = paid.slice(0, 400)
    const bank: Array<BankStatementRow> = limited
      .filter((s) => s.reconciled)
      .map((s) => ({
        bankRef: s.bankRef ?? '-',
        paymentCode: s.paymentCode,
        amount: s.amount,
        time: s.paidAt!.slice(11, 16),
        matchedSspdId: s.id,
      }))
    const seed = Number(date.replaceAll('-', '')) % 997
    if (date < TODAY && limited.length > 0) {
      bank.push({
        bankRef: `BP${date.replaceAll('-', '')}9${seed}`,
        paymentCode: `9205${String(seed).padStart(11, '0')}`,
        amount: 250_000 + seed * 1000,
        time: '16:20',
      })
    }
    return {
      date,
      bank,
      sspd: limited.map((s) => ({ ...row(db, s), matched: s.reconciled })),
      bankTotal: bank.reduce((sum, b) => sum + b.amount, 0),
      sspdTotal: limited.reduce((sum, s) => sum + s.amount, 0),
    }
  },

  'payments.markReconciled': async (id: string) => {
    const db = await getDb()
    const s = requireSspd(db, id)
    assert(s.status === 'paid', 'Hanya SSPD lunas yang dapat direkonsiliasi.')
    s.reconciled = true
    return { id: s.id }
  },
}
