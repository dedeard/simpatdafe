import { TODAY, addDays, daysBetween, monthKey, monthRange, monthsLate, nextMonthKey, toIso } from '@/lib/dates'
import { airTanahCalc, interestFor, reklameCalc, sptpdDueDate, tariffValue, taxDue } from '@/lib/tax'
import type { Assessment } from '../../resources/assessments'
import type { CollectionAction, Stpd } from '../../resources/collections'
import { CODE, SELF_ASSESSED_CODES } from '../../resources/reference'
import { SPTPD_LINE_PRESETS, type Sptpd, type SptpdLine, type SptpdStatus } from '../../resources/sptpd'
import type { TaxObject } from '../../resources/taxpayers'
import { billOf, taxpayerLabel } from '../bills'
import { docNo } from '../db'
import type { Rng } from '../rng'
import { addIntent, type Ctx } from './intents'
import { REALIZED_2026 } from './settings'

const PERIODS = monthRange('2025-12', '2026-10')
const OCT = '2026-10'

const SEASON: Record<string, number> = {
  '01': 1.15,
  '02': 1.1,
  '03': 1.05,
  '04': 1.0,
  '05': 0.7,
  '06': 0.6,
  '07': 0.55,
  '08': 0.6,
  '09': 0.8,
  '10': 1.1,
  '11': 1.2,
  '12': 1.3,
}

const REJECT_REASONS = [
  'Omzet tidak sesuai buku tamu',
  'Lampiran tidak lengkap',
  'Tarif yang digunakan tidak sesuai',
  'Masa pajak tidak sesuai dengan lampiran',
  'Perhitungan pajak terutang keliru',
]

const SIDE_BASE: Record<string, number> = {
  [CODE.mblb]: 40_000_000,
  [CODE.walet]: 5_000_000,
  [CODE.parking]: 8_000_000,
  [CODE.entertainment]: 15_000_000,
  [CODE.electricity]: 20_000_000,
}

type Entry = {
  object: TaxObject
  period: string
  weight: number
  status: SptpdStatus
  filedDate: string
  filedTime: string
  payDate?: string
  reason?: string
}

function baseWeight(rng: Rng, o: TaxObject) {
  const size = (o.capacity ?? 1) * (o.averageRate ?? 1)
  let base: number
  if (o.taxCode === CODE.hotel) base = size * (o.category === 'Homestay' ? 0.45 : 0.55)
  else if (o.taxCode === CODE.restaurant) base = size * 6
  else base = SIDE_BASE[o.taxCode] ?? 10_000_000
  return base * rng.lognormal(1, 0.35)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function buildLines(rng: Rng, code: string, target: number): Array<SptpdLine> {
  const presets = SPTPD_LINE_PRESETS[code] ?? ['Penjualan']
  const count = Math.min(presets.length, rng.int(1, presets.length))
  const raw = Array.from({ length: count }, () => rng.between(0.3, 1))
  const total = raw.reduce((a, b) => a + b, 0)
  return raw.map((share, i) => {
    const amount = (target * share) / total
    const kwh = presets[i].includes('kWh')
    const quantity = kwh ? rng.int(8_000, 60_000) : presets[i].includes('(kg)') ? rng.int(20, 400) : rng.int(8, 160)
    const unitPrice = Math.max(100, Math.round(amount / quantity / 100) * 100)
    return { description: presets[i], quantity, unitPrice, amount: quantity * unitPrice }
  })
}

export function seedSptpd(ctx: Ctx) {
  const { db, rng } = ctx
  const required = db.objects.filter((o) => o.reportingRequired && o.status === 'active')
  const entries: Array<Entry> = []

  const reportedInOct = new Set(
    rng
      .shuffle(required)
      .slice(0, 318)
      .map((o) => o.id),
  )

  for (const object of required) {
    const startKey = monthKey(object.startedAt)
    for (const period of PERIODS) {
      if (period < startKey) continue
      const isOct = period === OCT
      if (isOct && !reportedInOct.has(object.id)) continue
      if (!isOct && rng.chance(0.02)) continue

      const season = SEASON[period.slice(5)]
      const weight = baseWeight(rng, object) * season * rng.lognormal(1, 0.15)
      const next = nextMonthKey(period)
      const filedDay = isOct ? rng.int(1, 12) : rng.int(1, 20)
      const filedDate = `${next}-${pad2(filedDay)}`
      const filedTime = `${pad2(rng.int(8, 15))}:${pad2(rng.int(0, 59))}`

      let status: SptpdStatus
      let payDate: string | undefined
      let reason: string | undefined
      if (isOct) {
        status = rng.chance(0.65) ? 'verified' : 'submitted'
        if (status === 'verified' && rng.chance(0.5)) payDate = addDays(filedDate, rng.int(0, 3))
      } else if (rng.chance(0.03)) {
        status = 'rejected'
        reason = rng.pick(REJECT_REASONS)
      } else {
        status = 'verified'
        if (!rng.chance(0.03)) payDate = addDays(filedDate, rng.int(0, 6))
      }
      entries.push({ object, period, weight, status, filedDate, filedTime, payDate, reason })
    }
  }

  const showcase: Array<[string, string]> = [
    ['Resort Pulau Mansuar', '2026-07'],
    ['Eco Lodge Gam', '2026-08'],
    ['Homestay Sawandarek Indah', '2026-09'],
    ['Kafe Dermaga Waisai', '2026-09'],
  ]
  for (const [name, period] of showcase) {
    const entry = entries.find((e) => e.object.name === name && e.period === period)
    if (entry) {
      entry.status = 'verified'
      entry.payDate = undefined
      entry.reason = undefined
    }
  }

  const scale = new Map<string, number>()
  for (const code of SELF_ASSESSED_CODES) {
    const rate = tariffValue(db.tariffs, `rate.${code}`) / 100
    const paidWeight = entries.filter((e) => e.object.taxCode === code && e.payDate).reduce((s, e) => s + e.weight, 0)
    const target = REALIZED_2026[code] ?? 0
    scale.set(code, paidWeight > 0 ? target / (paidWeight * rate) : 1)
  }

  entries.sort((a, b) => `${a.filedDate}${a.filedTime}`.localeCompare(`${b.filedDate}${b.filedTime}`))

  for (const e of entries) {
    const code = e.object.taxCode
    const rate = tariffValue(db.tariffs, `rate.${code}`)
    const lines = buildLines(ctx.rng, code, e.weight * (scale.get(code) ?? 1))
    const gross = lines.reduce((s, l) => s + l.amount, 0)
    const filedAt = toIso(e.filedDate, e.filedTime)
    const sptpd: Sptpd = {
      id: docNo(db, 'SPTPD', e.filedDate),
      taxpayerId: e.object.taxpayerId,
      objectId: e.object.id,
      taxCode: code,
      period: e.period,
      lines,
      grossAmount: gross,
      rate,
      taxDue: taxDue(gross, rate),
      filedAt,
      filedBy: rng.chance(0.6) ? 'wp' : 'operator',
      dueDate: sptpdDueDate(e.period),
      status: e.status,
      rejectionReason: e.reason,
      verifiedAt: e.status === 'verified' ? toIso(addDays(e.filedDate, 1) > TODAY ? TODAY : addDays(e.filedDate, 1), '10:15') : undefined,
      attachments:
        code === CODE.hotel ? [`Rekap buku tamu ${e.period}.xlsx`, `Laporan omzet ${e.period}.pdf`] : [`Laporan omzet ${e.period}.pdf`],
    }
    db.sptpd.push(sptpd)
    if (e.payDate) {
      const bill = billOf(db, { kind: 'sptpd', id: sptpd.id })
      if (bill) addIntent(ctx, bill, filedAt, e.payDate)
    }
  }
}

type PendingAssessment = Omit<Assessment, 'id'> & { payDate?: string }

function randomDate(rng: Rng, from: string, to: string) {
  return addDays(from, rng.int(0, daysBetween(from, to)))
}

export function seedAssessments(ctx: Ctx) {
  const { db, rng } = ctx
  const pending: Array<PendingAssessment> = []

  const reklame = db.objects.filter((o) => o.taxCode === CODE.reklame)
  let paidSum = 0
  const reklameTarget = REALIZED_2026[CODE.reklame]
  while (paidSum < reklameTarget && reklame.length > 0) {
    const object = rng.pick(reklame)
    const type = rng.weighted<string>([
      ['papan', 40],
      ['spanduk', 25],
      ['neon', 20],
      ['kendaraan', 15],
    ])
    const roadClass = rng.weighted<string>([
      ['protokol', 25],
      ['utama', 40],
      ['lingkungan', 35],
    ])
    const width = type === 'papan' ? rng.int(3, 8) : type === 'spanduk' ? rng.int(2, 6) : rng.int(1, 3)
    const height = type === 'papan' ? rng.int(2, 4) : rng.int(1, 2)
    const sides = type === 'neon' ? rng.int(1, 2) : 1
    const months = rng.weighted<number>([
      [12, 60],
      [6, 25],
      [3, 15],
    ])
    const start = randomDate(rng, '2026-01-12', '2026-10-20')
    const issuedAt = addDays(start, -rng.int(5, 9))
    const calc = reklameCalc({ type, width, height, sides, roadClass, months }, db.tariffs, issuedAt)
    const pays = rng.chance(0.9)
    const payDate = pays ? addDays(issuedAt, rng.int(2, 28)) : undefined
    if (payDate && payDate > TODAY) continue
    if (payDate) paidSum += calc.tax
    pending.push({
      kind: 'skpd',
      taxpayerId: object.taxpayerId,
      objectId: object.id,
      taxCode: CODE.reklame,
      period: start.slice(0, 7),
      basis: calc.nsr,
      rate: calc.rate,
      principal: calc.tax,
      previouslyPaid: 0,
      penalty: 0,
      total: calc.tax,
      detail: [
        { label: 'Jenis reklame', value: type },
        { label: 'Ukuran', value: `${width} × ${height} m, ${sides} sisi` },
        { label: 'Kelas jalan', value: roadClass },
        { label: 'Masa pasang', value: `${start} s.d. ${addDays(start, months * 30)} (${months} bulan)` },
      ],
      createdAt: toIso(issuedAt, '09:00'),
      issuedAt: toIso(issuedAt, '09:30'),
      dueDate: addDays(issuedAt, 30),
      status: 'issued',
      payDate,
    })
  }

  const wells = db.objects.filter((o) => o.taxCode === CODE.airTanah)
  const meter = new Map(wells.map((o) => [o.id, rng.int(10_000, 50_000)]))
  const airEntries: Array<{ object: TaxObject; period: string; weight: number; payDate?: string; issuedAt: string; use: string }> = []
  for (const object of wells) {
    const baseVol = rng.lognormal(1, 0.5)
    const use = rng.chance(0.55) ? 'niaga' : 'industri'
    for (const period of PERIODS) {
      if (period === OCT && rng.chance(0.2)) continue
      const issuedAt = `${nextMonthKey(period)}-${pad2(rng.int(3, 12))}`
      if (issuedAt > TODAY) continue
      const weight = baseVol * (SEASON[period.slice(5)] ?? 1) * rng.lognormal(1, 0.12)
      const payDate = rng.chance(0.92) ? addDays(issuedAt, rng.int(2, 25)) : undefined
      airEntries.push({ object, period, weight, payDate: payDate && payDate <= TODAY ? payDate : undefined, issuedAt, use })
    }
  }
  const airTarget = REALIZED_2026[CODE.airTanah]
  const sampleRate = tariffValue(db.tariffs, `rate.${CODE.airTanah}`) / 100
  const paidAir = airEntries
    .filter((e) => e.payDate)
    .reduce((s, e) => s + e.weight * tariffValue(db.tariffs, `airtanah.npa.${e.use}`) * sampleRate, 0)
  const airScale = paidAir > 0 ? airTarget / paidAir : 1
  for (const e of airEntries) {
    const volume = Math.max(Math.round(e.weight * airScale), 20)
    const start = meter.get(e.object.id) ?? 0
    meter.set(e.object.id, start + volume)
    const calc = airTanahCalc({ meterStart: start, meterEnd: start + volume, use: e.use }, db.tariffs, e.issuedAt)
    pending.push({
      kind: 'skpd',
      taxpayerId: e.object.taxpayerId,
      objectId: e.object.id,
      taxCode: CODE.airTanah,
      period: e.period,
      basis: calc.npa,
      rate: calc.rate,
      principal: calc.tax,
      previouslyPaid: 0,
      penalty: 0,
      total: calc.tax,
      detail: [
        { label: 'Meter awal / akhir', value: `${start.toLocaleString('id-ID')} / ${(start + volume).toLocaleString('id-ID')} m³` },
        { label: 'Volume', value: `${volume.toLocaleString('id-ID')} m³` },
        { label: 'Peruntukan', value: e.use },
        { label: 'NPA per m³', value: `Rp${calc.npaPerM3.toLocaleString('id-ID')}` },
      ],
      createdAt: toIso(e.issuedAt, '09:00'),
      issuedAt: toIso(e.issuedAt, '09:30'),
      dueDate: addDays(e.issuedAt, 30),
      status: 'issued',
      payDate: e.payDate,
    })
  }

  const audited = db.sptpd.filter(
    (s) =>
      s.status === 'verified' &&
      (s.taxCode === CODE.hotel || s.taxCode === CODE.restaurant) &&
      s.period >= '2026-01' &&
      s.period <= '2026-07',
  )
  const showcaseTargets = ['Resort Pulau Mansuar', 'Eco Lodge Gam', 'Resort Teluk Kabui', 'Dive Lodge Kri', 'Homestay Arborek Lestari']
  const chosen = [
    ...showcaseTargets.map((name) => audited.find((s) => db.taxpayerById.get(s.taxpayerId)?.name === name)),
    ...rng.shuffle(audited).slice(0, 22),
  ].filter((s): s is Sptpd => Boolean(s))
  chosen.forEach((source, i) => {
    const forceOverdue = i < 3
    const dueSource = source.dueDate
    const issuedAt = forceOverdue
      ? randomDate(rng, '2026-08-01', '2026-09-20')
      : randomDate(rng, addDays(dueSource, 20) > '2026-10-15' ? '2026-10-01' : addDays(dueSource, 20), '2026-10-15')
    const factor = forceOverdue ? rng.between(1.5, 1.9) : rng.between(1.12, 1.6)
    const corrected = Math.round(source.grossAmount * factor)
    const principal = taxDue(corrected - source.grossAmount, source.rate)
    const months = monthsLate(dueSource, issuedAt)
    const penalty = interestFor(principal, months, db.tariffs, issuedAt)
    const pays = !forceOverdue && rng.chance(0.8)
    const payDate = pays ? addDays(issuedAt, rng.int(3, 25)) : undefined
    pending.push({
      kind: 'skpdkb',
      taxpayerId: source.taxpayerId,
      objectId: source.objectId,
      taxCode: source.taxCode,
      period: source.period,
      basis: corrected,
      rate: source.rate,
      principal,
      previouslyPaid: source.taxDue,
      penalty,
      total: principal + penalty,
      detail: [
        { label: 'Omzet dilaporkan', value: `Rp${source.grossAmount.toLocaleString('id-ID')}` },
        { label: 'Omzet hasil pemeriksaan', value: `Rp${corrected.toLocaleString('id-ID')}` },
        { label: 'Bulan keterlambatan', value: String(months) },
      ],
      sourceSptpdId: source.id,
      createdAt: toIso(issuedAt, '09:00'),
      issuedAt: toIso(issuedAt, '09:30'),
      dueDate: addDays(issuedAt, 30),
      status: 'issued',
      notes: 'Hasil pemeriksaan lapangan: catatan buku tamu dan kasir tidak sesuai dengan SPTPD.',
      payDate: payDate && payDate <= TODAY ? payDate : undefined,
    })
  })

  const drafts = Math.round(pending.length * 0.04)
  for (let i = 0; i < drafts; i++) {
    const object = rng.pick(reklame)
    pending.push({
      kind: 'skpd',
      taxpayerId: object.taxpayerId,
      objectId: object.id,
      taxCode: CODE.reklame,
      period: '2026-11',
      basis: 0,
      rate: 25,
      principal: 0,
      previouslyPaid: 0,
      penalty: 0,
      total: 0,
      detail: [],
      createdAt: toIso(`2026-11-${pad2(rng.int(2, 11))}`, '10:00'),
      status: 'draft',
    })
  }

  pending.sort((a, b) => (a.issuedAt ?? a.createdAt).localeCompare(b.issuedAt ?? b.createdAt))
  for (const p of pending) {
    const { payDate, ...rest } = p
    const date = (p.issuedAt ?? p.createdAt).slice(0, 10)
    const id =
      p.status === 'draft'
        ? `DRAF-${String(db.assessments.length + 1).padStart(4, '0')}`
        : docNo(db, p.kind === 'skpdkb' ? 'SKPDKB' : 'SKPD', date)
    const assessment: Assessment = { ...rest, id }
    db.assessments.push(assessment)
    if (payDate) {
      const bill = billOf(db, { kind: 'skpd', id })
      if (bill) addIntent(ctx, bill, assessment.issuedAt ?? assessment.createdAt, payDate)
    }
  }
}

const COLLECTION_NOTES = {
  telepon: [
    'Pemilik berada di Sorong, dihubungi via telepon, janji bayar dalam minggu ini.',
    'Telepon tidak diangkat, dilanjutkan pesan WhatsApp.',
    'Manajer menyatakan menunggu transfer dari kantor pusat.',
  ],
  kunjungan: [
    'Kunjungan lapangan dengan speedboat dinas, usaha tutup sementara (low season).',
    'Kunjungan lapangan, pemilik menyerahkan sebagian dokumen pendukung.',
    'Kunjungan ke lokasi usaha, ditemui pengelola dan diberikan salinan tagihan.',
  ],
  teguran: ['Teguran I diserahkan kepada pengelola.', 'Teguran II dikirim melalui kurir kabupaten.'],
  surat_paksa: ['Surat paksa diserahkan dan diterima pengelola usaha.'],
  janji_bayar: ['Wajib pajak berjanji melunasi setelah tamu rombongan membayar.'],
} as const

export function seedStpd(ctx: Ctx) {
  const { db, rng } = ctx
  const collectors = db.users.filter((u) => u.roleId === 'juru_tagih' || u.roleId === 'operator_penetapan')
  const candidates: Array<{ ref: { kind: 'sptpd' | 'skpd'; id: string }; due: string }> = []
  for (const s of db.sptpd) {
    if (s.status === 'verified' && !ctx.paid.has(`sptpd:${s.id}`) && s.dueDate < addDays(TODAY, -20))
      candidates.push({ ref: { kind: 'sptpd', id: s.id }, due: s.dueDate })
  }
  for (const a of db.assessments) {
    if (a.status === 'issued' && a.dueDate && !ctx.paid.has(`skpd:${a.id}`) && a.dueDate < addDays(TODAY, -20))
      candidates.push({ ref: { kind: 'skpd', id: a.id }, due: a.dueDate })
  }
  candidates.sort((a, b) => a.due.localeCompare(b.due))
  const picked = candidates.slice(0, 35)
  const statuses: Array<Stpd['status']> = [
    ...Array<Stpd['status']>(15).fill('issued'),
    ...Array<Stpd['status']>(10).fill('reminded'),
    ...Array<Stpd['status']>(4).fill('forced'),
    ...Array<Stpd['status']>(6).fill('paid'),
  ]
  const shuffled = rng.shuffle(statuses)

  const staged = picked.map((c, i) => {
    const bill = billOf(db, c.ref)!
    const status = shuffled[i] ?? 'issued'
    const maxIssue = status === 'paid' ? addDays(TODAY, -30) : addDays(TODAY, -2)
    const issuedAt = clampBefore(addDays(c.due, rng.int(10, 45)), maxIssue)
    return { c, bill, status, issuedAt }
  })
  staged.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))

  for (const { c, bill, status, issuedAt } of staged) {
    const months = monthsLate(c.due, issuedAt)
    const interest = interestFor(bill.amount, months, db.tariffs, issuedAt)
    const actions: Array<CollectionAction> = []
    const officer = () => rng.pick(collectors).name
    let cursor = issuedAt
    const act = (type: CollectionAction['type'], promiseDate?: string) => {
      cursor = clampBefore(addDays(cursor, rng.int(2, 9)), TODAY)
      actions.push({ type, date: cursor, officer: officer(), note: rng.pick(COLLECTION_NOTES[type]), promiseDate })
    }
    if (status === 'issued' && rng.chance(0.5)) act('telepon')
    if (status === 'reminded') {
      act('teguran')
      act(rng.pick(['telepon', 'kunjungan']))
    }
    if (status === 'forced') {
      act('teguran')
      act('kunjungan')
      act('surat_paksa')
    }
    if (status === 'paid') {
      act('teguran')
      act('janji_bayar', addDays(cursor, 7))
    }
    const stpd: Stpd = {
      id: docNo(db, 'STPD', issuedAt),
      taxpayerId: bill.taxpayerId,
      source: c.ref,
      payerName: taxpayerLabel(db, bill.taxpayerId),
      revenueCode: bill.revenueCode,
      principal: bill.amount,
      months,
      interest,
      total: bill.amount + interest,
      issuedAt,
      dueDate: addDays(issuedAt, 30),
      status: status === 'paid' ? 'forced' : status,
      actions,
    }
    db.stpd.push(stpd)
    if (status === 'paid') {
      const stpdBill = billOf(db, { kind: 'stpd', id: stpd.id })
      if (stpdBill) addIntent(ctx, stpdBill, toIso(issuedAt, '09:00'), clampBefore(addDays(cursor, rng.int(2, 12)), TODAY))
    }
  }
}

function clampBefore(date: string, max: string) {
  return date > max ? max : date
}
