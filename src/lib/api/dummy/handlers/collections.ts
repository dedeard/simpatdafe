import { TODAY, addDays, daysBetween, monthsLate } from '@/lib/dates'
import { interestFor } from '@/lib/tax'
import type { CollectionAction, OverdueRow, Stpd, StpdPreview, StpdRow } from '../../resources/collections'
import type { BillRef, TableQuery } from '../../resources/common'
import { revenueName } from '../../resources/reference'
import { billOf, overdueBills, type Bill } from '../bills'
import { docNo, filterValue, getDb, matches, paginate, regionName, type Db } from '../db'
import { ACTOR, assert, taxpayerNpwpd } from '../lookup'

const BUCKETS = ['1–30 hari', '31–90 hari', '91–180 hari', '> 180 hari']

function bucketIndex(days: number) {
  if (days <= 30) return 0
  if (days <= 90) return 1
  if (days <= 180) return 2
  return 3
}

function openStpdFor(db: Db, ref: BillRef) {
  return db.stpd.find((s) => s.source.kind === ref.kind && s.source.id === ref.id && s.status !== 'paid')
}

function overdueRow(db: Db, bill: Bill): OverdueRow {
  const daysLate = daysBetween(bill.dueDate!, TODAY)
  const months = monthsLate(bill.dueDate!, TODAY)
  const interest = interestFor(bill.amount, months, db.tariffs, TODAY)
  const stpd = openStpdFor(db, bill.ref)
  return {
    ref: bill.ref,
    label: bill.label,
    taxpayerId: bill.taxpayerId,
    npwpd: taxpayerNpwpd(db, bill.taxpayerId),
    payerName: bill.payerName,
    revenueCode: bill.revenueCode,
    revenueName: revenueName(bill.revenueCode),
    principal: bill.amount,
    dueDate: bill.dueDate!,
    daysLate,
    monthsLate: months,
    interest,
    total: bill.amount + interest,
    stage: stpd ? stpd.status : 'belum',
    stpdId: stpd?.id,
    distrik: bill.distrikId ? regionName(db, bill.distrikId) : '-',
  }
}

function stpdRow(db: Db, s: Stpd): StpdRow {
  return {
    ...s,
    revenueName: revenueName(s.revenueCode),
    npwpd: taxpayerNpwpd(db, s.taxpayerId),
    distrik: s.taxpayerId ? regionName(db, db.taxpayerById.get(s.taxpayerId)?.distrikId ?? '') : '-',
  }
}

function requireStpd(db: Db, id: string) {
  const s = db.stpd.find((x) => x.id === id)
  assert(s, 'STPD tidak ditemukan.')
  return s
}

const COLLECTIBLE: Array<BillRef['kind']> = ['sptpd', 'skpd', 'skrd', 'sppt']

export const collectionHandlers = {
  'collections.worklist': async (query: TableQuery = {}) => {
    const db = await getDb()
    const all = overdueBills(db).map((b) => overdueRow(db, b))
    const bucket = filterValue(query, 'bucket')
    const taxCode = filterValue(query, 'taxCode')
    const distrik = filterValue(query, 'distrik')
    const stage = filterValue(query, 'stage')
    const rows = all
      .filter((r) => !bucket || bucketIndex(r.daysLate) === Number(bucket))
      .filter((r) => !taxCode || r.revenueCode === taxCode)
      .filter((r) => !distrik || r.distrik === regionName(db, distrik))
      .filter((r) => !stage || r.stage === stage)
      .filter((r) => matches(`${r.label} ${r.payerName} ${r.npwpd ?? ''}`, query.q))
      .sort((a, b) => b.daysLate - a.daysLate || b.total - a.total)
    const buckets = BUCKETS.map((name, i) => {
      const inBucket = all.filter((r) => bucketIndex(r.daysLate) === i)
      return { bucket: name, count: inBucket.length, amount: inBucket.reduce((s, r) => s + r.total, 0) }
    })
    return paginate(rows, query, { buckets })
  },

  'stpd.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const status = filterValue(query, 'status')
    const rows = db.stpd
      .filter((s) => !status || s.status === status)
      .filter((s) => matches(`${s.id} ${s.payerName}`, query.q))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    const page = paginate(rows, query)
    return { ...page, rows: page.rows.map((s) => stpdRow(db, s)) }
  },

  'stpd.get': async (id: string) => {
    const db = await getDb()
    const s = requireStpd(db, id)
    return { ...stpdRow(db, s), sourceLabel: billOf(db, s.source)?.label ?? s.source.id }
  },

  'stpd.preview': async (source: BillRef): Promise<StpdPreview> => {
    const db = await getDb()
    assert(COLLECTIBLE.includes(source.kind), 'Jenis tagihan tidak dapat ditagih dengan STPD.')
    const bill = billOf(db, source)
    assert(bill && bill.payable && !bill.paid && bill.dueDate && bill.dueDate < TODAY, 'Tagihan belum jatuh tempo atau sudah lunas.')
    assert(!openStpdFor(db, source), 'Sudah ada STPD terbuka untuk tagihan ini.')
    const months = monthsLate(bill.dueDate, TODAY)
    const interest = interestFor(bill.amount, months, db.tariffs, TODAY)
    return {
      label: bill.label,
      payerName: bill.payerName,
      principal: bill.amount,
      months,
      interest,
      total: bill.amount + interest,
      dueDate: addDays(TODAY, 30),
      sourceDueDate: bill.dueDate,
    }
  },

  'stpd.create': async (input: { source: BillRef; issuedAt: string; note?: string }) => {
    const db = await getDb()
    const bill = billOf(db, input.source)
    assert(COLLECTIBLE.includes(input.source.kind), 'Jenis tagihan tidak dapat ditagih dengan STPD.')
    assert(bill && bill.payable && !bill.paid && bill.dueDate && bill.dueDate < TODAY, 'Tagihan belum jatuh tempo atau sudah lunas.')
    assert(!openStpdFor(db, input.source), 'Sudah ada STPD terbuka untuk tagihan ini.')
    assert(input.issuedAt <= TODAY && input.issuedAt > bill.dueDate, 'Tanggal terbit harus setelah jatuh tempo dan tidak di masa depan.')
    const months = monthsLate(bill.dueDate, input.issuedAt)
    const interest = interestFor(bill.amount, months, db.tariffs, input.issuedAt)
    const stpd: Stpd = {
      id: docNo(db, 'STPD', input.issuedAt),
      taxpayerId: bill.taxpayerId,
      source: input.source,
      payerName: bill.payerName,
      revenueCode: bill.revenueCode,
      principal: bill.amount,
      months,
      interest,
      total: bill.amount + interest,
      issuedAt: input.issuedAt,
      dueDate: addDays(input.issuedAt, 30),
      status: 'issued',
      actions: [],
      note: input.note,
    }
    db.stpd.push(stpd)
    return { id: stpd.id }
  },

  'stpd.addAction': async (input: { id: string; action: CollectionAction }) => {
    const db = await getDb()
    const s = requireStpd(db, input.id)
    assert(s.status !== 'paid', 'STPD sudah lunas.')
    assert(input.action.note.trim(), 'Catatan wajib diisi.')
    assert(input.action.date <= TODAY, 'Tanggal tindakan tidak boleh di masa depan.')
    if (input.action.type === 'janji_bayar')
      assert(input.action.promiseDate && input.action.promiseDate >= TODAY, 'Tanggal janji bayar wajib diisi.')
    s.actions.push({ ...input.action, note: input.action.note.trim() })
    return { id: s.id }
  },

  'stpd.advance': async (input: { id: string; to: 'reminded' | 'forced' }) => {
    const db = await getDb()
    const s = requireStpd(db, input.id)
    if (input.to === 'reminded') assert(s.status === 'issued', 'Teguran hanya dapat diterbitkan dari status Terbit.')
    else assert(s.status === 'reminded', 'Surat paksa hanya dapat diterbitkan setelah teguran.')
    s.status = input.to
    s.actions.push({
      type: input.to === 'reminded' ? 'teguran' : 'surat_paksa',
      date: TODAY,
      officer: ACTOR,
      note: input.to === 'reminded' ? 'Surat teguran diterbitkan.' : 'Surat paksa diterbitkan.',
    })
    return { id: s.id, status: s.status }
  },
}
