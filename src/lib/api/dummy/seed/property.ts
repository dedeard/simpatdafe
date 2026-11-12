import { TODAY, addDays, daysBetween, toIso } from '@/lib/dates'
import { bphtbCalc, spptCalc } from '@/lib/tax'
import {
  BPHTB_TYPE_LABEL,
  PPAT_LIST,
  REQUIRED_ATTACHMENTS,
  type BphtbFiling,
  type BphtbStatus,
  type BphtbType,
} from '../../resources/bphtb'
import { BUILDING_CLASSES, LAND_CLASSES, type PbbObject, type PbbUse, type Sppt } from '../../resources/pbb'
import { CODE } from '../../resources/reference'
import { billOf, type Bill } from '../bills'
import { docNo, type Db } from '../db'
import type { Rng } from '../rng'
import { addIntent, refKey, type Ctx } from './intents'
import { nik, personName } from './names'
import { REALIZED_2026 } from './settings'
import { allocate, pad2 } from './util'

const PBB_COUNT = 3_400
const PBB_YEAR = 2026
const PBB_ISSUE_TARGET = 2_800_000_000

const landValue = (cls: string) => LAND_CLASSES.find((c) => c.value === cls)!.perM2
const buildingValue = (cls: string) => BUILDING_CLASSES.find((c) => c.value === cls)!.perM2

function landClassFor(rng: Rng, distrikId: string) {
  if (distrikId === 'd01')
    return rng.weighted<string>([
      ['A1', 15],
      ['A2', 35],
      ['B1', 50],
    ])
  if (['d09', 'd03', 'd02'].includes(distrikId))
    return rng.weighted<string>([
      ['B1', 20],
      ['B2', 40],
      ['C1', 40],
    ])
  return rng.weighted<string>([
    ['B2', 20],
    ['C1', 40],
    ['C2', 40],
  ])
}

export function buildNop(db: Db, distrikId: string, kampungId: string, seq: number) {
  const d = db.regions.find((r) => r.id === distrikId)!
  const k = d.kampung.find((x) => x.id === kampungId)!
  const block = Math.floor(seq / 50) + 1
  return `92.05.${d.code.padStart(3, '0')}.${k.code.padStart(3, '0')}.${String(block).padStart(3, '0')}-${String(seq % 10000).padStart(4, '0')}.0`
}

function njopOf(o: Pick<PbbObject, 'landArea' | 'buildingArea' | 'landValuePerM2' | 'buildingValuePerM2'>) {
  return Math.round(o.landArea * o.landValuePerM2 + o.buildingArea * o.buildingValuePerM2)
}

export function recomputeNjop(o: PbbObject) {
  o.njop = njopOf(o)
}

export function computeSpptAmounts(db: Db, objects: Array<PbbObject>, year: number) {
  const exempted = new Set<string>()
  const date = `${year}-02-10`
  return objects.map((o) => {
    const owner = o.ownerNik ?? o.ownerName
    const first = !exempted.has(owner)
    exempted.add(owner)
    return { object: o, calc: spptCalc(o.njop, first, db.tariffs, date) }
  })
}

export function seedPbb(ctx: Ctx) {
  const { db, rng } = ctx
  const owners: Array<{ name: string; nik: string; address: string }> = []
  const objects: Array<PbbObject> = []

  const GENERAL: Array<[string, number]> = [
    ['d01', 60],
    ['d09', 10],
    ['d03', 6],
    ['d02', 6],
    ['d10', 4],
    ['d04', 3],
    ['d05', 3],
    ['d07', 3],
    ['d08', 2],
    ['d11', 1],
    ['d06', 1],
    ['d12', 1],
  ]

  for (let i = 1; i <= PBB_COUNT; i++) {
    const resort = i <= 40
    const distrikId = resort
      ? rng.weighted<string>([
          ['d09', 40],
          ['d03', 30],
          ['d10', 15],
          ['d01', 15],
        ])
      : rng.weighted(GENERAL)
    const distrik = db.regions.find((r) => r.id === distrikId)!
    const kampung = rng.pick(distrik.kampung)
    const landClass = resort ? rng.pick(['B1', 'B2', 'C1']) : landClassFor(rng, distrikId)
    const landArea = resort
      ? rng.int(3_000, 25_000)
      : Math.min(Math.max(Math.round(rng.lognormal(distrikId === 'd01' ? 420 : 700, 0.7)), 60), 12_000)
    const hasBuilding = resort || rng.chance(0.72)
    const buildingClass = resort
      ? rng.weighted<string>([
          ['S1', 50],
          ['S2', 40],
          ['S3', 10],
        ])
      : distrikId === 'd01'
        ? rng.weighted<string>([
            ['S2', 40],
            ['S3', 40],
            ['S1', 8],
            ['S4', 12],
          ])
        : rng.weighted<string>([
            ['S4', 55],
            ['S3', 35],
            ['S2', 10],
          ])
    const buildingArea = hasBuilding ? (resort ? rng.int(500, 3_000) : Math.min(Math.max(Math.round(rng.lognormal(70, 0.5)), 20), 600)) : 0
    const use: PbbUse = resort
      ? 'pariwisata'
      : hasBuilding
        ? rng.weighted<PbbUse>([
            ['perumahan', 70],
            ['usaha', 20],
            ['kantor', 3],
            ['pariwisata', 7],
          ])
        : rng.weighted<PbbUse>([
            ['tanah_kosong', 60],
            ['kebun', 40],
          ])

    let owner = owners.length > 0 && rng.chance(0.13) ? rng.pick(owners) : undefined
    if (!owner) {
      owner = { name: personName(rng), nik: nik(rng), address: `${kampung.name}, Kabupaten Raja Ampat` }
      owners.push(owner)
    }

    const object: PbbObject = {
      nop: buildNop(db, distrikId, kampung.id, i),
      ownerName: owner.name,
      ownerNik: owner.nik,
      ownerAddress: owner.address,
      objectAddress: `${kampung.name}, Distrik ${distrik.name}`,
      distrikId,
      kampungId: kampung.id,
      landArea,
      buildingArea,
      landClass,
      buildingClass: hasBuilding ? buildingClass : 'S4',
      landValuePerM2: landValue(landClass),
      buildingValuePerM2: buildingValue(hasBuilding ? buildingClass : 'S4'),
      njop: 0,
      use,
      ownershipHistory: [{ owner: owner.name, from: addDays('2019-01-01', rng.int(0, 2400)), source: 'Pendataan awal' }],
    }
    recomputeNjop(object)
    objects.push(object)
  }

  for (let pass = 0; pass < 5; pass++) {
    const total = computeSpptAmounts(db, objects, PBB_YEAR).reduce((s, x) => s + x.calc.amount, 0)
    const factor = PBB_ISSUE_TARGET / total
    if (Math.abs(factor - 1) < 0.01) break
    for (const o of objects) {
      o.landArea = Math.max(Math.round(o.landArea * factor), 20)
      o.buildingArea = o.buildingArea > 0 ? Math.max(Math.round(o.buildingArea * factor), 12) : 0
      recomputeNjop(o)
    }
  }

  db.pbbObjects.push(...objects)

  const issued = computeSpptAmounts(db, objects, PBB_YEAR)
  const spptList: Array<Sppt> = issued.map(({ object, calc }) => ({
    nop: object.nop,
    year: PBB_YEAR,
    njop: object.njop,
    njoptkp: calc.njoptkp,
    njkp: calc.njkp,
    rate: calc.rate,
    amount: calc.amount,
    dueDate: `${PBB_YEAR}-09-30`,
    status: 'issued',
  }))
  db.sppt.push(...spptList)

  const target = REALIZED_2026[CODE.pbb]
  let paid = 0
  for (const sppt of rng.shuffle(spptList.filter((s) => s.amount > 0))) {
    if (paid >= target) break
    const late = rng.chance(0.05)
    const payDate = late ? addDays('2026-10-01', rng.int(0, 41)) : addDays('2026-03-01', Math.round(Math.pow(rng.next(), 0.6) * 213))
    const bill = billOf(db, { kind: 'sppt', id: `${sppt.nop}@${sppt.year}` })
    if (!bill) continue
    paid += sppt.amount
    addIntent(ctx, bill, toIso(payDate > TODAY ? TODAY : payDate, '07:45'), payDate)
  }
}

const BPHTB_WEIGHTS: Array<[BphtbType, number]> = [
  ['jual_beli', 70],
  ['waris', 15],
  ['hibah', 10],
  ['pemberian_hak_baru', 5],
]

export function seedBphtb(ctx: Ctx) {
  const { db, rng } = ctx
  const target = REALIZED_2026[CODE.bphtb]
  let paid = 0
  const staged: Array<Omit<BphtbFiling, 'id'> & { payDate?: string }> = []

  let guard = 0
  while (paid < target && guard++ < 4000) {
    const object = [rng.pick(db.pbbObjects), rng.pick(db.pbbObjects), rng.pick(db.pbbObjects)].sort((a, b) => a.njop - b.njop)[0]
    const transactionType = rng.weighted(BPHTB_WEIGHTS)
    const below = transactionType === 'jual_beli' && rng.chance(0.2)
    const price = Math.round((below ? object.njop * rng.between(0.5, 0.95) : object.njop * rng.lognormal(1.15, 0.45)) / 500_000) * 500_000
    const submittedAt = addDays('2026-01-05', rng.int(0, daysBetween('2026-01-05', '2026-11-10')))
    const calc = bphtbCalc({ price, njop: object.njop, transactionType }, db.tariffs, submittedAt)
    const age = daysBetween(submittedAt, TODAY)

    let status: BphtbStatus
    const roll = rng.next()
    if (age > 45) status = roll < 0.88 ? 'validated' : roll < 0.94 ? 'rejected' : 'paid'
    else if (age > 10)
      status = roll < 0.78 ? 'validated' : roll < 0.84 ? 'paid' : roll < 0.9 ? 'rejected' : roll < 0.95 ? 'verified' : 'submitted'
    else status = roll < 0.35 ? 'submitted' : roll < 0.65 ? 'verified' : roll < 0.75 ? 'paid' : roll < 0.9 ? 'validated' : 'rejected'
    if (calc.amount === 0 && (status === 'paid' || status === 'validated')) status = 'verified'

    let payDate: string | undefined
    let validatedAt: string | undefined
    if (status === 'paid' || status === 'validated') {
      payDate = addDays(submittedAt, rng.int(3, 12))
      if (payDate > TODAY) {
        status = 'verified'
        payDate = undefined
      }
    }
    if (status === 'validated' && payDate) {
      validatedAt = toIso(addDays(payDate, rng.int(1, 5)) > TODAY ? TODAY : addDays(payDate, rng.int(1, 5)), '13:00')
    }
    if (payDate) paid += calc.amount

    const buyerName = personName(rng)
    staged.push({
      nop: object.nop,
      transactionType,
      buyer: {
        name: buyerName,
        nik: nik(rng),
        address: `${rng.pick(['Waisai', 'Saonek', 'Sorong', 'Arborek', 'Yellu'])}, Papua Barat Daya`,
      },
      seller: { name: object.ownerName, nik: object.ownerNik },
      ppat: transactionType === 'waris' ? undefined : rng.pick(PPAT_LIST),
      landArea: object.landArea,
      buildingArea: object.buildingArea,
      declaredPrice: price,
      njop: object.njop,
      npop: calc.npop,
      npoptkp: calc.npoptkp,
      npopkp: calc.npopkp,
      rate: calc.rate,
      amount: calc.amount,
      status,
      verificationNote:
        status === 'rejected'
          ? rng.pick(['Dokumen akta tidak lengkap', 'NIK pembeli tidak sesuai KTP', 'Objek memiliki tunggakan PBB-P2'])
          : calc.belowNjop && status !== 'submitted'
            ? 'Harga transaksi di bawah NJOP, dasar pengenaan memakai NJOP.'
            : undefined,
      attachments: [...REQUIRED_ATTACHMENTS],
      submittedAt: toIso(submittedAt, `${pad2(rng.int(8, 15))}:${pad2(rng.int(0, 59))}`),
      validatedAt,
      payDate,
    })
  }

  staged.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  for (const s of staged) {
    const { payDate, ...rest } = s
    const filing: BphtbFiling = { ...rest, id: docNo(db, 'BPHTB', s.submittedAt.slice(0, 10)) }
    db.bphtb.push(filing)
    if (payDate) {
      const bill = billOf(db, { kind: 'bphtb', id: filing.id })
      if (bill) addIntent(ctx, bill, toIso(addDays(payDate, -1), '09:00'), payDate)
    }
    if (filing.status === 'validated' && filing.validatedAt && filing.transactionType !== 'lelang') {
      const object = db.pbbObjects.find((o) => o.nop === filing.nop)
      if (object) {
        object.ownerName = filing.buyer.name
        object.ownerNik = filing.buyer.nik
        object.ownershipHistory.push({
          owner: filing.buyer.name,
          from: filing.validatedAt.slice(0, 10),
          source: `${BPHTB_TYPE_LABEL[filing.transactionType]} · ${filing.id}`,
        })
      }
    }
  }
}

export function seedOpsen(ctx: Ctx) {
  const { rng } = ctx
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  const lines: Array<[string, string, number]> = [
    [CODE.opsenPkb, 'Opsen PKB', REALIZED_2026[CODE.opsenPkb]],
    [CODE.opsenBbnkb, 'Opsen BBNKB', REALIZED_2026[CODE.opsenBbnkb]],
  ]
  for (const [code, label, total] of lines) {
    const amounts = allocate(
      Math.round(total / 1000),
      months.map(() => rng.lognormal(1, 0.15)),
    ).map((a) => a * 1000)
    months.forEach((month, i) => {
      const day = month === '2026-11' ? 10 : rng.int(8, 18)
      const date = `${month}-${pad2(day)}`
      const bill: Bill = {
        ref: { kind: 'opsen', id: `opsen-${month}-${code}` },
        label: `Bagian ${label} ${month}`,
        payerName: 'Bapenda Provinsi Papua Barat Daya',
        revenueCode: code,
        amount: amounts[i],
        paid: false,
        payable: true,
      }
      ctx.intents.push({ bill, createdAt: toIso(date, '08:00'), paidAt: toIso(date, '10:30'), channel: 'teller' })
      ctx.paid.add(refKey(bill))
    })
  }
}
