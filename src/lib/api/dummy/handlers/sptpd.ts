import { DEMO_NOW, monthKey, TODAY } from '@/lib/dates'
import { sptpdDueDate, tariffValue, taxDue } from '@/lib/tax'
import type { TableQuery } from '../../resources/common'
import { revenueName, SELF_ASSESSED_CODES } from '../../resources/reference'
import type { MissingRow, Sptpd, SptpdInput, SptpdRow } from '../../resources/sptpd'
import { docNo, filterValue, getDb, matches, paginate, regionName, type Db } from '../db'
import { assert, objectName, taxpayerName, taxpayerNpwpd, validateObjectOwner } from '../lookup'

const DEFAULT_PERIOD = '2026-10'

function row(db: Db, s: Sptpd): SptpdRow {
  return {
    ...s,
    npwpd: taxpayerNpwpd(db, s.taxpayerId) ?? '-',
    taxpayerName: taxpayerName(db, s.taxpayerId),
    objectName: objectName(db, s.objectId),
    taxName: revenueName(s.taxCode),
    distrik: regionName(db, db.taxpayerById.get(s.taxpayerId)?.distrikId ?? ''),
  }
}

function requireSptpd(db: Db, id: string) {
  const s = db.sptpd.find((x) => x.id === id)
  assert(s, 'SPTPD tidak ditemukan.')
  return s
}

export const sptpdHandlers = {
  'sptpd.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const period = filterValue(query, 'period') ?? DEFAULT_PERIOD
    const taxCode = filterValue(query, 'taxCode')
    const status = filterValue(query, 'status')
    const distrik = filterValue(query, 'distrik')
    const tab = filterValue(query, 'tab')

    const inPeriod = db.sptpd.filter((s) => s.period === period)
    const rows = db.sptpd
      .filter((s) => !filterValue(query, 'period') || s.period === period)
      .filter((s) => !taxCode || s.taxCode === taxCode)
      .filter((s) => !status || s.status === status)
      .filter((s) => tab !== 'verify' || s.status === 'submitted')
      .filter((s) => !distrik || db.taxpayerById.get(s.taxpayerId)?.distrikId === distrik)
      .filter((s) =>
        matches(
          `${s.id} ${taxpayerName(db, s.taxpayerId)} ${taxpayerNpwpd(db, s.taxpayerId) ?? ''} ${objectName(db, s.objectId)}`,
          query.q,
        ),
      )
      .sort((a, b) => b.filedAt.localeCompare(a.filedAt))

    const valid = inPeriod.filter((s) => s.status === 'submitted' || s.status === 'verified')
    const stats = {
      period,
      mustReport: db.objects.filter((o) => o.reportingRequired && monthKey(o.startedAt) <= period).length,
      reported: valid.length,
      totalTax: valid.reduce((sum, s) => sum + s.taxDue, 0),
    }
    const page = paginate(rows, query, stats)
    return { ...page, rows: page.rows.map((s) => row(db, s)) }
  },

  'sptpd.missing': async (query: TableQuery = {}) => {
    const db = await getDb()
    const period = filterValue(query, 'period') ?? DEFAULT_PERIOD
    const reported = new Set(db.sptpd.filter((s) => s.period === period && s.status !== 'rejected').map((s) => s.objectId))
    const taxCode = filterValue(query, 'taxCode')
    const rows: Array<MissingRow> = db.objects
      .filter((o) => o.reportingRequired && o.status === 'active' && monthKey(o.startedAt) <= period && !reported.has(o.id))
      .filter((o) => !taxCode || o.taxCode === taxCode)
      .filter((o) => matches(`${o.name} ${taxpayerName(db, o.taxpayerId)} ${taxpayerNpwpd(db, o.taxpayerId) ?? ''}`, query.q))
      .map((o) => ({
        objectId: o.id,
        taxpayerId: o.taxpayerId,
        npwpd: taxpayerNpwpd(db, o.taxpayerId) ?? '-',
        taxpayerName: taxpayerName(db, o.taxpayerId),
        objectName: o.name,
        taxCode: o.taxCode,
        taxName: revenueName(o.taxCode),
        distrik: regionName(db, o.distrikId),
      }))
    return paginate(rows, query)
  },

  'sptpd.get': async (id: string) => {
    const db = await getDb()
    return row(db, requireSptpd(db, id))
  },

  'sptpd.create': async (input: SptpdInput) => {
    const db = await getDb()
    const { object } = validateObjectOwner(db, input.taxpayerId, input.objectId)
    assert(SELF_ASSESSED_CODES.includes(object.taxCode), 'Objek ini tidak dikenai pajak self assessment.')
    assert(/^\d{4}-\d{2}$/.test(input.period) && input.period < monthKey(TODAY), 'Masa pajak harus sebelum bulan berjalan.')
    assert(
      !db.sptpd.some((s) => s.objectId === object.id && s.period === input.period && s.status !== 'rejected'),
      'Sudah ada SPTPD untuk objek dan masa pajak ini.',
    )
    assert(input.lines.length > 0, 'Rincian omzet minimal 1 baris.')
    const lines = input.lines.map((l) => {
      assert(l.description.trim(), 'Uraian rincian wajib diisi.')
      assert(l.quantity > 0 && l.unitPrice >= 0, 'Jumlah dan harga satuan tidak valid.')
      return {
        description: l.description.trim(),
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: Math.round(l.quantity * l.unitPrice),
      }
    })
    const gross = lines.reduce((s, l) => s + l.amount, 0)
    assert(gross > 0, 'Omzet harus lebih dari nol.')
    const rate = tariffValue(db.tariffs, `rate.${object.taxCode}`, TODAY)
    const sptpd: Sptpd = {
      id: docNo(db, 'SPTPD', TODAY),
      taxpayerId: input.taxpayerId,
      objectId: object.id,
      taxCode: object.taxCode,
      period: input.period,
      lines,
      grossAmount: gross,
      rate,
      taxDue: taxDue(gross, rate),
      filedAt: DEMO_NOW,
      filedBy: 'operator',
      dueDate: sptpdDueDate(input.period),
      status: input.submit ? 'submitted' : 'draft',
      attachments: input.attachments,
      note: input.note,
    }
    db.sptpd.push(sptpd)
    return { id: sptpd.id }
  },

  'sptpd.decide': async (input: { id: string; action: 'submit' | 'verify' | 'reject'; reason?: string }) => {
    const db = await getDb()
    const s = requireSptpd(db, input.id)
    if (input.action === 'submit') {
      assert(s.status === 'draft', 'Hanya draf yang dapat dilaporkan.')
      s.status = 'submitted'
      s.filedAt = DEMO_NOW
    } else if (input.action === 'verify') {
      assert(s.status === 'submitted', 'Hanya SPTPD berstatus Dilaporkan yang dapat diverifikasi.')
      s.status = 'verified'
      s.verifiedAt = DEMO_NOW
    } else {
      assert(s.status === 'submitted', 'Hanya SPTPD berstatus Dilaporkan yang dapat ditolak.')
      const reason = input.reason?.trim()
      assert(reason, 'Alasan penolakan wajib diisi.')
      s.status = 'rejected'
      s.rejectionReason = reason
    }
    return { id: s.id, status: s.status }
  },

  'sptpd.forTaxpayer': async (taxpayerId: string) => {
    const db = await getDb()
    return db.sptpd
      .filter((s) => s.taxpayerId === taxpayerId && s.status === 'verified')
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 24)
      .map((s) => ({
        id: s.id,
        period: s.period,
        taxName: revenueName(s.taxCode),
        grossAmount: s.grossAmount,
        taxDue: s.taxDue,
        rate: s.rate,
        dueDate: s.dueDate,
        objectName: objectName(db, s.objectId),
      }))
  },
}
