import { TODAY, addDays, toIso } from '@/lib/dates'
import type { BillRef } from '../resources/common'
import type { Channel, Sspd } from '../resources/payments'
import { CODE } from '../resources/reference'
import { docNo, fail, paymentCode, regionName, type Db } from './db'

export type Bill = {
  ref: BillRef
  label: string
  taxpayerId?: string
  payerName: string
  revenueCode: string
  amount: number
  dueDate?: string
  paid: boolean
  payable: boolean
  sspdId?: string
  distrikId?: string
}

export function taxpayerLabel(db: Db, taxpayerId?: string) {
  return taxpayerId ? (db.taxpayerById.get(taxpayerId)?.name ?? '-') : '-'
}

function distrikOf(db: Db, taxpayerId?: string) {
  return taxpayerId ? db.taxpayerById.get(taxpayerId)?.distrikId : undefined
}

export function billOf(db: Db, ref: BillRef): Bill | undefined {
  switch (ref.kind) {
    case 'sptpd': {
      const s = db.sptpd.find((x) => x.id === ref.id)
      if (!s) return undefined
      return {
        ref,
        label: `SPTPD ${s.period} · ${s.id}`,
        taxpayerId: s.taxpayerId,
        payerName: taxpayerLabel(db, s.taxpayerId),
        revenueCode: s.taxCode,
        amount: s.taxDue,
        dueDate: s.dueDate,
        paid: Boolean(s.paidAt),
        payable: s.status === 'verified',
        sspdId: s.sspdId,
        distrikId: distrikOf(db, s.taxpayerId),
      }
    }
    case 'skpd': {
      const a = db.assessments.find((x) => x.id === ref.id)
      if (!a) return undefined
      return {
        ref,
        label: `${a.kind === 'skpdkb' ? 'SKPDKB' : 'SKPD'} · ${a.id}`,
        taxpayerId: a.taxpayerId,
        payerName: taxpayerLabel(db, a.taxpayerId),
        revenueCode: a.taxCode,
        amount: a.total,
        dueDate: a.dueDate,
        paid: a.status === 'paid',
        payable: a.status === 'issued',
        sspdId: a.sspdId,
        distrikId: distrikOf(db, a.taxpayerId),
      }
    }
    case 'stpd': {
      const t = db.stpd.find((x) => x.id === ref.id)
      if (!t) return undefined
      return {
        ref,
        label: `STPD · ${t.id}`,
        taxpayerId: t.taxpayerId,
        payerName: t.payerName,
        revenueCode: t.revenueCode,
        amount: t.total,
        dueDate: t.dueDate,
        paid: t.status === 'paid',
        payable: t.status !== 'paid',
        sspdId: t.sspdId,
        distrikId: distrikOf(db, t.taxpayerId),
      }
    }
    case 'skrd': {
      const k = db.skrd.find((x) => x.id === ref.id)
      if (!k) return undefined
      return {
        ref,
        label: `SKRD ${k.period} · ${k.id}`,
        taxpayerId: k.taxpayerId,
        payerName: k.payerName,
        revenueCode: k.retributionCode,
        amount: k.total,
        dueDate: k.dueDate,
        paid: k.status === 'paid',
        payable: k.status === 'issued',
        sspdId: k.sspdId,
        distrikId: distrikOf(db, k.taxpayerId),
      }
    }
    case 'sppt': {
      const [nop, year] = ref.id.split('@')
      const s = db.sppt.find((x) => x.nop === nop && String(x.year) === year)
      const o = db.pbbObjects.find((x) => x.nop === nop)
      if (!s || !o) return undefined
      return {
        ref,
        label: `SPPT ${s.year} · ${s.nop}`,
        payerName: o.ownerName,
        revenueCode: CODE.pbb,
        amount: s.amount,
        dueDate: s.dueDate,
        paid: s.status === 'paid',
        payable: s.status === 'issued' && s.amount > 0,
        sspdId: s.sspdId,
        distrikId: o.distrikId,
      }
    }
    case 'bphtb': {
      const b = db.bphtb.find((x) => x.id === ref.id)
      if (!b) return undefined
      return {
        ref,
        label: `BPHTB · ${b.id}`,
        payerName: b.buyer.name,
        revenueCode: CODE.bphtb,
        amount: b.amount,
        paid: ['paid', 'validated'].includes(b.status),
        payable: b.status === 'verified',
        sspdId: b.sspdId,
        distrikId: db.pbbObjects.find((o) => o.nop === b.nop)?.distrikId,
      }
    }
    case 'port': {
      const p = db.portBills.find((x) => x.id === ref.id)
      if (!p) return undefined
      return {
        ref,
        label: `Pelabuhan · ${p.id}`,
        payerName: db.vessels.find((v) => v.id === p.vesselId)?.name ?? 'Penumpang umum',
        revenueCode: CODE.port,
        amount: p.total,
        paid: p.status === 'paid',
        payable: p.status === 'unpaid',
        sspdId: p.sspdId,
      }
    }
    default:
      return undefined
  }
}

export function markBillPaid(db: Db, ref: BillRef, sspdId: string, paidAt: string) {
  switch (ref.kind) {
    case 'sptpd': {
      const s = db.sptpd.find((x) => x.id === ref.id)
      if (s) Object.assign(s, { sspdId, paidAt })
      return
    }
    case 'skpd': {
      const a = db.assessments.find((x) => x.id === ref.id)
      if (a) Object.assign(a, { status: 'paid', sspdId, paidAt })
      return
    }
    case 'skrd': {
      const k = db.skrd.find((x) => x.id === ref.id)
      if (k) Object.assign(k, { status: 'paid', sspdId, paidAt })
      return
    }
    case 'sppt': {
      const [nop, year] = ref.id.split('@')
      const s = db.sppt.find((x) => x.nop === nop && String(x.year) === year)
      if (s) Object.assign(s, { status: 'paid', sspdId, paidAt })
      return
    }
    case 'bphtb': {
      const b = db.bphtb.find((x) => x.id === ref.id)
      if (b) Object.assign(b, { status: b.status === 'validated' ? 'validated' : 'paid', sspdId, paidAt })
      return
    }
    case 'port': {
      const p = db.portBills.find((x) => x.id === ref.id)
      if (p) Object.assign(p, { status: 'paid', sspdId, paidAt })
      return
    }
    case 'stpd': {
      const t = db.stpd.find((x) => x.id === ref.id)
      if (!t) return
      Object.assign(t, { status: 'paid', sspdId, paidAt })
      markBillPaid(db, t.source, sspdId, paidAt)
      return
    }
    default:
  }
}

export function overdueBills(db: Db, today: string = TODAY) {
  const result: Array<Bill> = []
  const push = (ref: BillRef) => {
    const bill = billOf(db, ref)
    if (bill && bill.payable && !bill.paid && bill.dueDate && bill.dueDate < today) result.push(bill)
  }
  for (const s of db.sptpd) if (s.status === 'verified' && !s.paidAt && s.dueDate < today) push({ kind: 'sptpd', id: s.id })
  for (const a of db.assessments) if (a.status === 'issued' && a.dueDate && a.dueDate < today) push({ kind: 'skpd', id: a.id })
  for (const k of db.skrd) if (k.status === 'issued' && k.dueDate < today) push({ kind: 'skrd', id: k.id })
  for (const p of db.sppt) if (p.status === 'issued' && p.amount > 0 && p.dueDate < today) push({ kind: 'sppt', id: `${p.nop}@${p.year}` })
  return result
}

export function openSspd(
  db: Db,
  bill: Bill,
  createdAt: string,
  paid?: { channel: Channel; paidAt: string; bankRef: string; reconciled?: boolean },
): Sspd {
  const date = createdAt.slice(0, 10)
  const sspd: Sspd = {
    id: docNo(db, 'SSPD', date),
    paymentCode: paymentCode(db),
    bill: bill.ref,
    taxpayerId: bill.taxpayerId,
    payerName: bill.payerName,
    revenueCode: bill.revenueCode,
    description: bill.label,
    amount: bill.amount,
    createdAt,
    expiresAt: toIso(addDays(date, 7), '23:59'),
    status: paid ? 'paid' : 'pending',
    reconciled: false,
    ...(paid ? { channel: paid.channel, paidAt: paid.paidAt, bankRef: paid.bankRef, reconciled: paid.reconciled ?? true } : {}),
  }
  db.sspd.push(sspd)
  if (paid) markBillPaid(db, bill.ref, sspd.id, paid.paidAt)
  return sspd
}

export function ensureBill(db: Db, ref: BillRef) {
  const bill = billOf(db, ref)
  if (!bill) fail('Tagihan tidak ditemukan.')
  return bill
}

export function distrikNameOfBill(db: Db, bill: Bill) {
  return bill.distrikId ? regionName(db, bill.distrikId) : '-'
}
