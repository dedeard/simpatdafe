import { TODAY, addDays, monthLabel, monthRange, toIso } from '@/lib/dates'
import { tariffValue, ticketPrice } from '@/lib/tax'
import type { PortBill, PortId, PortItem, PortService, Vessel, VesselType } from '../../resources/port'
import { CODE } from '../../resources/reference'
import type { Skrd, SkrdLine } from '../../resources/retributions'
import type { EntryCategory, EntryTicket, SellingPoint, Visitor } from '../../resources/tourism'
import { billOf, type Bill } from '../bills'
import { docNo } from '../db'
import type { Rng } from '../rng'
import { addIntent, refKey, type Ctx } from './intents'
import { VESSEL_NAMES, digits, foreignName, nik, personName } from './names'
import { REALIZED_2026 } from './settings'
import { TOURISM_SEASON, allocate, dateRange, pad2, weekdayFactor } from './util'

const TOTALS: Record<EntryCategory, number> = { mancanegara: 34_812, domestik: 17_846, lokal: 1_500 }
const BLUD_TOTAL = 49_920

const NATIONALITY_WEIGHTS: Array<[string, number]> = [
  ['AU', 14],
  ['US', 14],
  ['DE', 10],
  ['FR', 8],
  ['GB', 8],
  ['NL', 7],
  ['CN', 8],
  ['IT', 5],
  ['ES', 4],
  ['CH', 4],
  ['JP', 5],
  ['SG', 5],
]

const GROUP_SIZES: Array<[number, number]> = [
  [1, 18],
  [2, 30],
  [3, 14],
  [4, 14],
  [5, 6],
  [6, 6],
  [8, 6],
  [10, 3],
  [12, 3],
]

function groupVisitors(rng: Rng, category: EntryCategory, size: number): Array<Visitor> {
  const nationality = category === 'mancanegara' ? rng.weighted(NATIONALITY_WEIGHTS) : 'ID'
  return Array.from({ length: size }, () => ({
    name: category === 'mancanegara' ? foreignName(rng) : personName(rng),
    nationality,
    category,
    idNumber: category === 'mancanegara' ? `${rng.pick(['P', 'X', 'E'])}${digits(rng, 8)}` : nik(rng),
  }))
}

function soldTime(rng: Rng) {
  const hour = rng.weighted<number>([
    [11, 20],
    [10, 8],
    [12, 8],
    [16, 14],
    [15, 6],
    [17, 6],
    [8, 6],
    [9, 6],
    [13, 8],
    [14, 8],
    [18, 4],
  ])
  return `${pad2(hour)}:${pad2(rng.int(0, 59))}`
}

export function seedTickets(ctx: Ctx) {
  const { db, rng } = ctx
  const days = dateRange('2026-01-01', TODAY)
  const weights = days.map((d) => TOURISM_SEASON[d.slice(5, 7)] * weekdayFactor(d) * rng.lognormal(1, 0.25))
  const perCategory = (Object.keys(TOTALS) as Array<EntryCategory>).map((c) => ({
    category: c,
    counts: allocate(TOTALS[c], c === 'lokal' ? weights.map(() => 1) : weights.map((w) => w * rng.lognormal(1, 0.1))),
  }))

  const loketStaff = db.users.filter((u) => u.roleId === 'petugas_loket')
  const staged: Array<Omit<EntryTicket, 'id' | 'sspdId'> & { date: string }> = []
  const uptdPerDay: Array<number> = days.map(() => 0)

  days.forEach((date, dayIndex) => {
    for (const { category, counts } of perCategory) {
      let remaining = counts[dayIndex]
      uptdPerDay[dayIndex] += remaining
      while (remaining > 0) {
        const size = Math.min(remaining, rng.weighted(GROUP_SIZES))
        remaining -= size
        const point = rng.weighted<SellingPoint>([
          ['pelabuhan_waisai', 78],
          ['bandara_marinda', 10],
          ['loket_online', 8],
          ['pos_misool', 4],
        ])
        const visitors = groupVisitors(rng, category, size)
        const total = visitors.reduce((s, v) => s + ticketPrice(v.category, db.tariffs, date), 0)
        const staff =
          point === 'loket_online'
            ? undefined
            : rng.pick(loketStaff.filter((u) => (point === 'pos_misool' ? u.post === 'Pos Misool' : u.post === 'Pelabuhan Waisai')))
        staged.push({
          date,
          point,
          visitors,
          total,
          validFrom: date,
          validUntil: addDays(date, 365),
          channel: rng.weighted<EntryTicket['channel']>([
            ['qris', 55],
            ['tunai', 25],
            ['va', 20],
          ]),
          soldAt: toIso(date, soldTime(rng)),
          officer: staff?.name ?? 'Sistem loket online',
        })
      }
    }
  })

  staged.sort((a, b) => a.soldAt.localeCompare(b.soldAt))
  for (const s of staged) {
    const { date, ...rest } = s
    const ticket: EntryTicket = { ...rest, id: docNo(db, 'TKT', date), sspdId: '' }
    db.tickets.push(ticket)
    if (ticket.total > 0) {
      const bill: Bill = {
        ref: { kind: 'ticket', id: ticket.id },
        label: `Tiket wisata · ${ticket.id}`,
        payerName: ticket.visitors[0].name,
        revenueCode: CODE.tourism,
        amount: ticket.total,
        paid: false,
        payable: true,
      }
      const channel = ticket.channel === 'tunai' ? 'bendahara' : ticket.channel
      ctx.intents.push({ bill, createdAt: ticket.soldAt, paidAt: ticket.soldAt, channel })
      ctx.paid.add(refKey(bill))
    }
  }

  const bludWeights = uptdPerDay.map((v) => Math.max(v, 1) * rng.between(0.75, 1.02))
  const blud = allocate(BLUD_TOTAL, bludWeights)
  days.forEach((d, i) => db.bludCounts.set(d, blud[i]))
  for (const d of rng.shuffle(days.filter((x) => x < '2026-10-01')).slice(0, 3)) {
    db.checkedDays.set(d, 'Selisih dicek ke petugas pos provinsi; sebagian wisatawan membayar di pos provinsi saja.')
  }
}

const VESSEL_SPECS: Array<[VesselType, number, [number, number]]> = [
  ['kapal_cepat', 5, [80, 180]],
  ['ferry', 3, [400, 900]],
  ['liveaboard', 6, [100, 300]],
  ['speedboat', 4, [5, 20]],
  ['kapal_barang', 3, [300, 1200]],
  ['kapal_ikan', 3, [30, 120]],
]

export function seedVessels(ctx: Ctx) {
  const { db, rng } = ctx
  let n = 0
  for (const [type, count, [min, max]] of VESSEL_SPECS) {
    for (const name of VESSEL_NAMES[type].slice(0, count)) {
      n += 1
      const vessel: Vessel = {
        id: `ves-${pad2(n)}`,
        name: type === 'liveaboard' ? `Liveaboard ${name}` : name,
        type,
        grossTonnage: rng.int(min, max),
        owner:
          type === 'speedboat' || type === 'kapal_ikan'
            ? personName(rng)
            : `PT ${rng.pick(['Pelayaran', 'Bahari', 'Samudra', 'Wisata Bahari'])} ${rng.pick(['Nusantara', 'Timur', 'Papua', 'Raja Ampat'])}`,
        homePort: rng.pick(['Sorong', 'Waisai', 'Misool', 'Makassar']),
      }
      db.vessels.push(vessel)
    }
  }
}

function unitFor(service: PortService) {
  return { pas_penumpang: 'orang', tambat: 'GT × etmal', labuh: 'GT', bongkar_muat: 'ton', parkir_kendaraan: 'kendaraan' }[service]
}

export function seedPort(ctx: Ctx) {
  const { db, rng } = ctx
  seedVessels(ctx)
  const staged: Array<Omit<PortBill, 'id'> & { payDate?: string }> = []
  const target = REALIZED_2026[CODE.port]
  let paidSum = 0
  const days = dateRange('2026-01-01', TODAY)
  const dayWeights = days.map((d) => TOURISM_SEASON[d.slice(5, 7)] * weekdayFactor(d))

  const item = (service: PortService, quantity: number): PortItem => {
    const unitPrice = tariffValue(db.tariffs, `port.${service}`)
    return { service, quantity, unit: unitFor(service), unitPrice, amount: quantity * unitPrice }
  }

  let guard = 0
  while (paidSum < target && guard++ < 6000) {
    const date = days[Number(rng.weighted(dayWeights.map((w, i) => [i, w] as [number, number])))]
    const vessel = rng.pick(db.vessels)
    const highSeason = ['01', '02', '03', '04', '10', '11', '12'].includes(date.slice(5, 7))
    if (vessel.type === 'liveaboard' && !highSeason) continue
    const port: PortId = rng.weighted<PortId>([
      ['waisai', 74],
      ['saonek', 12],
      ['yellu', 8],
      ['harapan_jaya', 6],
    ])
    const items: Array<PortItem> = []
    const seasonFactor = highSeason ? 1 : 0.55
    if (vessel.type === 'kapal_cepat' || vessel.type === 'ferry') {
      items.push(item('pas_penumpang', Math.round(rng.int(60, 420) * seasonFactor)))
      items.push(item('labuh', vessel.grossTonnage))
      if (vessel.type === 'ferry') items.push(item('parkir_kendaraan', rng.int(2, 30)))
    } else if (vessel.type === 'liveaboard') {
      items.push(item('tambat', vessel.grossTonnage * rng.int(1, 3)))
      items.push(item('labuh', vessel.grossTonnage))
      items.push(item('pas_penumpang', rng.int(8, 22)))
    } else if (vessel.type === 'speedboat') {
      items.push(item('pas_penumpang', rng.int(4, 14)))
      items.push(item('labuh', vessel.grossTonnage))
    } else if (vessel.type === 'kapal_barang') {
      items.push(item('labuh', vessel.grossTonnage))
      items.push(item('tambat', vessel.grossTonnage * rng.int(1, 2)))
      items.push(item('bongkar_muat', rng.int(20, 220)))
    } else {
      items.push(item('labuh', vessel.grossTonnage))
      items.push(item('tambat', vessel.grossTonnage))
    }
    const total = items.reduce((s, i) => s + i.amount, 0)
    const pays = date <= addDays(TODAY, -2) && rng.chance(0.94)
    if (pays) paidSum += total
    staged.push({
      port,
      vesselId: vessel.id,
      items,
      total,
      serviceDate: date,
      status: 'unpaid',
      payDate: pays ? addDays(date, rng.int(0, 3)) : undefined,
    })
  }

  staged.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate))
  for (const s of staged) {
    const { payDate, ...rest } = s
    const bill: PortBill = { ...rest, id: docNo(db, 'PORT', s.serviceDate) }
    db.portBills.push(bill)
    if (payDate) {
      const b = billOf(db, { kind: 'port', id: bill.id })
      if (b) addIntent(ctx, b, toIso(bill.serviceDate, '08:30'), payDate)
    }
  }
}

type PendingSkrd = Omit<Skrd, 'id'> & { payDate?: string }

export function seedSkrd(ctx: Ctx) {
  const { db, rng } = ctx
  const pending: Array<PendingSkrd> = []

  const WASTE_TARIFF = {
    homestay: tariffValue(db.tariffs, 'waste.homestay'),
    resort: tariffValue(db.tariffs, 'waste.resort'),
    restaurant: tariffValue(db.tariffs, 'waste.restaurant'),
  }
  const candidates = rng.shuffle(
    db.taxpayers
      .filter((t) => t.status === 'active' && t.registeredAt < '2026-01-01' && ['d01', 'd09', 'd03', 'd02'].includes(t.distrikId))
      .map((t) => ({
        t,
        object: db.objects.find((o) => o.taxpayerId === t.id && (o.taxCode === CODE.hotel || o.taxCode === CODE.restaurant)),
      }))
      .filter((x) => x.object),
  )
  const periods = monthRange('2026-01', '2026-10')
  const wasteTarget = REALIZED_2026[CODE.waste]
  let wastePaid = 0
  for (const { t, object } of candidates) {
    if (wastePaid >= wasteTarget) break
    const tier = object!.taxCode === CODE.restaurant ? 'restaurant' : object!.category === 'Homestay' ? 'homestay' : 'resort'
    db.wasteSubscribers.push({ taxpayerId: t.id, tier })
    const price = WASTE_TARIFF[tier]
    for (const period of periods) {
      const isOct = period === '2026-10'
      const issuedAt = isOct ? '2026-10-25' : `${period}-${pad2(rng.int(1, 4))}`
      const pays = isOct ? rng.chance(0.4) : rng.chance(0.92)
      const payDate = pays ? addDays(issuedAt, isOct ? rng.int(2, 16) : rng.int(2, 26)) : undefined
      const line: SkrdLine = {
        description: `Retribusi persampahan ${monthLabel(period)}`,
        quantity: 1,
        unit: 'bulan',
        unitPrice: price,
        amount: price,
      }
      if (payDate && payDate > TODAY) continue
      if (payDate) wastePaid += price
      pending.push({
        retributionCode: CODE.waste,
        taxpayerId: t.id,
        payerName: t.name,
        payerAddress: t.address,
        period,
        lines: [line],
        total: price,
        issuedAt,
        dueDate: addDays(issuedAt, 30),
        status: 'issued',
        payDate,
      })
    }
  }

  const pbgTarget = REALIZED_2026[CODE.pbg]
  let pbgPaid = 0
  const unit = tariffValue(db.tariffs, 'pbg.unit')
  const FUNCTIONS = ['hunian', 'homestay', 'usaha', 'gudang', 'resort', 'kantor']
  while (pbgPaid < pbgTarget) {
    const luas = Math.max(Math.round(rng.lognormal(260, 0.95)), 24)
    const index = Number(rng.between(1.1, 2.4).toFixed(2))
    const unitPrice = Math.round(unit * index)
    const total = luas * unitPrice
    const issuedAt = addDays('2026-01-05', rng.int(0, 300))
    const payDate = rng.chance(0.9) ? addDays(issuedAt, rng.int(3, 28)) : undefined
    if (payDate && payDate > TODAY) continue
    if (payDate) pbgPaid += total
    const person = personName(rng)
    pending.push({
      retributionCode: CODE.pbg,
      payerName: person,
      payerAddress: `${rng.pick(['Waisai', 'Saonek', 'Arborek', 'Yellu', 'Fafanlap', 'Warmasen'])}, Kabupaten Raja Ampat`,
      period: issuedAt,
      lines: [
        {
          description: `Retribusi PBG fungsi ${rng.pick(FUNCTIONS)} (indeks ${index})`,
          quantity: luas,
          unit: 'm²',
          unitPrice,
          amount: total,
        },
      ],
      total,
      issuedAt,
      dueDate: addDays(issuedAt, 30),
      status: 'issued',
      payDate,
    })
  }

  const assetTarget = REALIZED_2026[CODE.assets]
  let assetPaid = 0
  const ASSETS: Array<[string, number, string, [number, number]]> = [
    ['Sewa gedung pertemuan', 2_500_000, 'hari', [1, 4]],
    ['Sewa speedboat dinas', 3_000_000, 'hari', [1, 5]],
    ['Sewa kios pasar', 500_000, 'bulan', [3, 12]],
    ['Sewa lahan pelabuhan', 1_200_000, 'bulan', [2, 8]],
  ]
  while (assetPaid < assetTarget) {
    const [desc, price, unitName, [qMin, qMax]] = rng.pick(ASSETS)
    const quantity = rng.int(qMin, qMax)
    const total = price * quantity
    const issuedAt = addDays('2026-01-08', rng.int(0, 290))
    const payDate = rng.chance(0.88) ? addDays(issuedAt, rng.int(2, 20)) : undefined
    if (payDate && payDate > TODAY) continue
    if (payDate) assetPaid += total
    pending.push({
      retributionCode: CODE.assets,
      payerName: rng.chance(0.5)
        ? personName(rng)
        : `CV ${rng.pick(['Karya', 'Bahari', 'Mandiri'])} ${rng.pick(['Waisai', 'Papua', 'Timur'])}`,
      payerAddress: 'Waisai, Kabupaten Raja Ampat',
      period: issuedAt,
      lines: [{ description: desc, quantity, unit: unitName, unitPrice: price, amount: total }],
      total,
      issuedAt,
      dueDate: addDays(issuedAt, 30),
      status: 'issued',
      payDate,
    })
  }

  pending.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))
  for (const p of pending) {
    const { payDate, ...rest } = p
    const skrd: Skrd = { ...rest, id: docNo(db, 'SKRD', p.issuedAt) }
    db.skrd.push(skrd)
    if (payDate) {
      const bill = billOf(db, { kind: 'skrd', id: skrd.id })
      if (bill) addIntent(ctx, bill, toIso(skrd.issuedAt, '09:00'), payDate)
    }
  }
}
