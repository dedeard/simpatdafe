import { DEMO_NOW, TODAY, addDays, monthsLate } from '@/lib/dates'
import { airTanahCalc, interestFor, reklameCalc, taxDue } from '@/lib/tax'
import type { Assessment, AssessmentInput, AssessmentRow, AssessmentStatus } from '../../resources/assessments'
import type { TableQuery } from '../../resources/common'
import { CODE, revenueName } from '../../resources/reference'
import { docNo, filterValue, getDb, matches, paginate, type Db } from '../db'
import { assert, objectName, taxpayerName, taxpayerNpwpd, validateObjectOwner } from '../lookup'

function derive(a: Assessment): AssessmentStatus {
  return a.status === 'issued' && a.dueDate && a.dueDate < TODAY ? 'overdue' : a.status
}

function row(db: Db, a: Assessment): AssessmentRow {
  return {
    ...a,
    status: derive(a),
    npwpd: taxpayerNpwpd(db, a.taxpayerId) ?? '-',
    taxpayerName: taxpayerName(db, a.taxpayerId),
    objectName: objectName(db, a.objectId),
    taxName: revenueName(a.taxCode),
  }
}

function requireAssessment(db: Db, id: string) {
  const a = db.assessments.find((x) => x.id === id)
  assert(a, 'Ketetapan tidak ditemukan.')
  return a
}

function finalize(db: Db, a: Assessment) {
  a.status = 'issued'
  a.id = docNo(db, a.kind === 'skpdkb' ? 'SKPDKB' : 'SKPD', TODAY)
  a.issuedAt = DEMO_NOW
  a.dueDate = addDays(TODAY, 30)
}

export const assessmentHandlers = {
  'assessments.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const kind = filterValue(query, 'kind')
    const taxCode = filterValue(query, 'taxCode')
    const status = filterValue(query, 'status')
    const year = filterValue(query, 'year')
    const filtered = db.assessments
      .filter((a) => !kind || a.kind === kind)
      .filter((a) => !taxCode || a.taxCode === taxCode)
      .filter((a) => !status || derive(a) === status)
      .filter((a) => !year || a.createdAt.startsWith(year))
      .filter((a) =>
        matches(
          `${a.id} ${taxpayerName(db, a.taxpayerId)} ${taxpayerNpwpd(db, a.taxpayerId) ?? ''} ${objectName(db, a.objectId)}`,
          query.q,
        ),
      )
      .sort((a, b) => (b.issuedAt ?? b.createdAt).localeCompare(a.issuedAt ?? a.createdAt))
    const live = filtered.filter((a) => a.status !== 'draft' && a.status !== 'cancelled')
    const overdue = live.filter((a) => derive(a) === 'overdue')
    const stats = {
      issued: live.length,
      total: live.reduce((s, a) => s + a.total, 0),
      overdue: overdue.length,
      overdueAmount: overdue.reduce((s, a) => s + a.total, 0),
    }
    const page = paginate(filtered, query, stats)
    return { ...page, rows: page.rows.map((a) => row(db, a)) }
  },

  'assessments.get': async (id: string) => {
    const db = await getDb()
    const a = requireAssessment(db, id)
    return { ...row(db, a), sptpd: a.sourceSptpdId ? db.sptpd.find((s) => s.id === a.sourceSptpdId) : undefined }
  },

  'assessments.create': async (input: AssessmentInput) => {
    const db = await getDb()
    let assessment: Assessment

    if (input.kind === 'reklame') {
      const { object } = validateObjectOwner(db, input.taxpayerId, input.objectId)
      assert(object.taxCode === CODE.reklame, 'Objek bukan objek pajak reklame.')
      const r = input.reklame
      assert(r.width > 0 && r.height > 0 && r.width * r.height <= 100, 'Ukuran reklame harus > 0 dan maksimal 100 m².')
      assert(r.sides >= 1 && r.sides <= 4, 'Jumlah sisi 1–4.')
      assert(r.months >= 1 && r.months <= 12, 'Masa pasang 1–12 bulan.')
      assert(r.start, 'Tanggal mulai pasang wajib diisi.')
      const calc = reklameCalc(
        { type: r.type, width: r.width, height: r.height, sides: r.sides, roadClass: r.roadClass, months: r.months },
        db.tariffs,
        TODAY,
      )
      assessment = {
        id: `DRAF-${String(db.assessments.length + 1).padStart(4, '0')}`,
        kind: 'skpd',
        taxpayerId: input.taxpayerId,
        objectId: input.objectId,
        taxCode: CODE.reklame,
        period: r.start.slice(0, 7),
        basis: calc.nsr,
        rate: calc.rate,
        principal: calc.tax,
        previouslyPaid: 0,
        penalty: 0,
        total: calc.tax,
        detail: [
          { label: 'Jenis reklame', value: r.type },
          { label: 'Ukuran', value: `${r.width} × ${r.height} m, ${r.sides} sisi` },
          { label: 'Kelas jalan', value: r.roadClass },
          { label: 'Masa pasang', value: `${r.start} (${r.months} bulan)` },
        ],
        createdAt: DEMO_NOW,
        status: 'draft',
      }
    } else if (input.kind === 'airtanah') {
      const { object } = validateObjectOwner(db, input.taxpayerId, input.objectId)
      assert(object.taxCode === CODE.airTanah, 'Objek bukan objek pajak air tanah.')
      const a = input.airTanah
      assert(a.meterEnd > a.meterStart, 'Meter akhir harus lebih besar dari meter awal.')
      const calc = airTanahCalc(a, db.tariffs, TODAY)
      assessment = {
        id: `DRAF-${String(db.assessments.length + 1).padStart(4, '0')}`,
        kind: 'skpd',
        taxpayerId: input.taxpayerId,
        objectId: input.objectId,
        taxCode: CODE.airTanah,
        period: a.period,
        basis: calc.npa,
        rate: calc.rate,
        principal: calc.tax,
        previouslyPaid: 0,
        penalty: 0,
        total: calc.tax,
        detail: [
          { label: 'Meter awal / akhir', value: `${a.meterStart} / ${a.meterEnd} m³` },
          { label: 'Volume', value: `${calc.volume} m³` },
          { label: 'Peruntukan', value: a.use },
          { label: 'NPA per m³', value: `Rp${calc.npaPerM3}` },
        ],
        createdAt: DEMO_NOW,
        status: 'draft',
      }
    } else {
      const source = db.sptpd.find((s) => s.id === input.sptpdId)
      assert(
        source && source.status === 'verified' && source.taxpayerId === input.taxpayerId,
        'Pilih SPTPD terverifikasi milik wajib pajak ini.',
      )
      assert(input.correctedGross > source.grossAmount, 'Omzet koreksi harus lebih besar dari omzet dilaporkan.')
      assert(input.notes.trim(), 'Catatan pemeriksaan wajib diisi.')
      const principal = taxDue(input.correctedGross - source.grossAmount, source.rate)
      const months = monthsLate(source.dueDate, TODAY)
      const penalty = interestFor(principal, months, db.tariffs, TODAY)
      assessment = {
        id: `DRAF-${String(db.assessments.length + 1).padStart(4, '0')}`,
        kind: 'skpdkb',
        taxpayerId: source.taxpayerId,
        objectId: source.objectId,
        taxCode: source.taxCode,
        period: source.period,
        basis: input.correctedGross,
        rate: source.rate,
        principal,
        previouslyPaid: source.taxDue,
        penalty,
        total: principal + penalty,
        detail: [
          { label: 'Omzet dilaporkan', value: `Rp${source.grossAmount.toLocaleString('id-ID')}` },
          { label: 'Omzet hasil pemeriksaan', value: `Rp${input.correctedGross.toLocaleString('id-ID')}` },
          { label: 'Bulan keterlambatan', value: String(months) },
        ],
        sourceSptpdId: source.id,
        createdAt: DEMO_NOW,
        status: 'draft',
        notes: input.notes.trim(),
      }
    }

    db.assessments.push(assessment)
    if (input.issue) finalize(db, assessment)
    return { id: assessment.id }
  },

  'assessments.issue': async (id: string) => {
    const db = await getDb()
    const a = requireAssessment(db, id)
    assert(a.status === 'draft', 'Hanya draf yang dapat diterbitkan.')
    assert(a.total > 0, 'Total ketetapan harus lebih dari nol.')
    finalize(db, a)
    return { id: a.id }
  },

  'assessments.cancel': async (input: { id: string; reason: string }) => {
    const db = await getDb()
    const a = requireAssessment(db, input.id)
    assert(a.status === 'issued' || a.status === 'draft', 'Ketetapan tidak dapat dibatalkan.')
    assert(!a.paidAt, 'Ketetapan yang sudah dibayar tidak dapat dibatalkan.')
    assert(input.reason.trim(), 'Alasan pembatalan wajib diisi.')
    a.status = 'cancelled'
    a.cancelReason = input.reason.trim()
    return { id: a.id }
  },
}
