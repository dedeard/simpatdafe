import { addDays, daysBetween } from '@/lib/dates'
import { CODE, TAX_TYPE_BY_CODE } from '../../resources/reference'
import type { TaxObject, Taxpayer, TaxpayerStatus, TaxpayerType } from '../../resources/taxpayers'
import { addObject, addTaxpayer, type Db } from '../db'
import type { Rng } from '../rng'
import { businessName, digits, homestayName, nik, personName, phone, resortName, restaurantName, surname } from './names'

const REQUIRED_TOTAL = 412

type Group =
  'homestay' | 'resort' | 'restaurant' | 'mblb' | 'reklame' | 'airtanah' | 'walet' | 'parkir' | 'hiburan' | 'listrik' | 'individual'

type Spec = {
  group: Group
  name?: string
  type?: TaxpayerType
  distrikId?: string
  kampungId?: string
  category?: string
  status?: TaxpayerStatus
  registeredAt?: string
  capacity?: number
  averageRate?: number
}

const CENTERS: Record<string, [number, number]> = {
  d01: [-0.429, 130.833],
  d02: [-0.52, 130.76],
  d03: [-0.47, 130.65],
  d04: [-0.18, 130.8],
  d05: [-0.36, 130.97],
  d06: [-1.19, 129.8],
  d07: [-0.94, 130.9],
  d08: [-0.83, 130.67],
  d09: [-0.58, 130.58],
  d10: [-2.0, 130.1],
  d11: [-1.98, 129.9],
  d12: [0.4, 131.1],
}

const GENERAL: Array<[string, number]> = [
  ['d01', 34],
  ['d09', 22],
  ['d03', 14],
  ['d02', 9],
  ['d10', 8],
  ['d04', 3],
  ['d05', 3],
  ['d06', 2],
  ['d07', 2],
  ['d08', 2],
  ['d11', 1],
]
const RESORT: Array<[string, number]> = [
  ['d09', 30],
  ['d03', 22],
  ['d10', 14],
  ['d01', 10],
  ['d02', 6],
  ['d08', 8],
  ['d06', 4],
  ['d11', 4],
  ['d04', 2],
]
const INDIVIDUAL: Array<[string, number]> = [
  ['d01', 55],
  ['d09', 12],
  ['d03', 8],
  ['d02', 8],
  ['d10', 6],
  ['d04', 3],
  ['d05', 3],
  ['d07', 3],
  ['d08', 2],
]
const EXTRACTION: Array<[string, number]> = [
  ['d01', 35],
  ['d07', 20],
  ['d05', 20],
  ['d02', 15],
  ['d10', 10],
]

function pickDistrik(rng: Rng, group: Group) {
  const table =
    group === 'resort' ? RESORT : group === 'individual' ? INDIVIDUAL : group === 'mblb' || group === 'airtanah' ? EXTRACTION : GENERAL
  return rng.weighted(table)
}

function randomDate(rng: Rng, from: string, to: string) {
  return addDays(from, rng.int(0, daysBetween(from, to)))
}

function objectTaxCode(group: Group) {
  switch (group) {
    case 'homestay':
    case 'resort':
      return CODE.hotel
    case 'restaurant':
      return CODE.restaurant
    case 'mblb':
      return CODE.mblb
    case 'reklame':
      return CODE.reklame
    case 'airtanah':
      return CODE.airTanah
    case 'walet':
      return CODE.walet
    case 'parkir':
      return CODE.parking
    case 'hiburan':
      return CODE.entertainment
    case 'listrik':
      return CODE.electricity
    default:
      return undefined
  }
}

const SHOWCASE: Array<Spec> = [
  {
    group: 'resort',
    name: 'Resort Teluk Kabui',
    category: 'Resort',
    distrikId: 'd03',
    kampungId: 'd03k01',
    capacity: 28,
    averageRate: 6_500_000,
    type: 'badan',
  },
  {
    group: 'resort',
    name: 'Eco Lodge Gam',
    category: 'Resort',
    distrikId: 'd03',
    kampungId: 'd03k04',
    capacity: 16,
    averageRate: 3_800_000,
    type: 'badan',
  },
  {
    group: 'resort',
    name: 'Resort Pulau Mansuar',
    category: 'Resort',
    distrikId: 'd09',
    kampungId: 'd09k02',
    capacity: 22,
    averageRate: 5_200_000,
    type: 'badan',
  },
  {
    group: 'resort',
    name: 'Dive Lodge Kri',
    category: 'Dive lodge',
    distrikId: 'd09',
    kampungId: 'd09k03',
    capacity: 20,
    averageRate: 7_800_000,
    type: 'badan',
  },
  {
    group: 'homestay',
    name: 'Homestay Arborek Lestari',
    distrikId: 'd09',
    kampungId: 'd09k01',
    capacity: 14,
    averageRate: 1_200_000,
    type: 'pribadi',
  },
  {
    group: 'homestay',
    name: 'Homestay Sawandarek Indah',
    distrikId: 'd09',
    kampungId: 'd09k04',
    capacity: 14,
    averageRate: 1_100_000,
    type: 'pribadi',
  },
  {
    group: 'restaurant',
    name: 'RM Ikan Bakar Waisai',
    category: 'Rumah makan',
    distrikId: 'd01',
    kampungId: 'd01k01',
    capacity: 60,
    averageRate: 85_000,
    type: 'pribadi',
  },
  {
    group: 'restaurant',
    name: 'Kafe Dermaga Waisai',
    category: 'Kafe',
    distrikId: 'd01',
    kampungId: 'd01k01',
    capacity: 40,
    averageRate: 70_000,
    type: 'pribadi',
  },
  { group: 'mblb', name: 'CV Batu Karang Misool', category: 'Galian batu', distrikId: 'd10', kampungId: 'd10k05', type: 'badan' },
  { group: 'individual', name: 'PT Samudra Waigeo', distrikId: 'd02', kampungId: 'd02k01', type: 'badan' },
]

function buildSpecs(rng: Rng): Array<Spec> {
  const specs: Array<Spec> = [...SHOWCASE]
  const count = (group: Group) => specs.filter((s) => s.group === group).length
  const fill = (group: Group, total: number, make: () => Spec) => {
    while (count(group) < total) specs.push(make())
  }

  fill('homestay', 486, () => ({ group: 'homestay' }))
  fill('resort', 74, () => ({
    group: 'resort',
    category: rng.weighted<string>([
      ['Resort', 30],
      ['Dive lodge', 25],
      ['Hotel', 12],
      ['Liveaboard', 7],
    ]),
  }))
  fill('restaurant', 212, () => ({
    group: 'restaurant',
    category: rng.weighted<string>([
      ['Rumah makan', 110],
      ['Kafe', 70],
      ['Warung', 20],
      ['Katering', 12],
    ]),
  }))
  fill('mblb', 40, () => ({ group: 'mblb', category: rng.pick(['Galian pasir', 'Galian batu', 'Galian kerikil']) }))
  fill('reklame', 25, () => ({ group: 'reklame' }))
  fill('airtanah', 15, () => ({ group: 'airtanah' }))
  fill('walet', 10, () => ({ group: 'walet' }))
  fill('parkir', 20, () => ({ group: 'parkir' }))
  fill('hiburan', 15, () => ({ group: 'hiburan' }))
  fill('listrik', 10, () => ({ group: 'listrik' }))
  fill('individual', 341, () => ({ group: 'individual' }))

  const individuals = specs.filter((s) => s.group === 'individual' && !s.name)
  individuals.slice(0, 7).forEach((s, i) => {
    s.registeredAt = `2026-11-${String(i + 2).padStart(2, '0')}`
  })

  const extra = (group: Group, status: TaxpayerStatus, registeredAt: () => string, total: number) => {
    for (let i = 0; i < total; i++) specs.push({ group, status, registeredAt: registeredAt() })
  }
  const novDate = () => `2026-11-${String(rng.int(1, 12)).padStart(2, '0')}`
  const lateOct = () => `2026-10-${String(rng.int(26, 31)).padStart(2, '0')}`
  extra('homestay', 'verification', novDate, 6)
  extra('restaurant', 'verification', novDate, 4)
  extra('homestay', 'verification', lateOct, 3)
  extra('restaurant', 'verification', lateOct, 2)
  extra('mblb', 'verification', lateOct, 0)
  extra('hiburan', 'verification', lateOct, 0)
  extra('homestay', 'draft', novDate, 4)
  extra('restaurant', 'draft', novDate, 2)
  extra('homestay', 'suspended', () => randomDate(rng, '2019-01-01', '2024-12-31'), 8)
  extra('homestay', 'closed', () => randomDate(rng, '2018-06-01', '2024-06-30'), 9)
  extra('restaurant', 'closed', () => randomDate(rng, '2018-06-01', '2024-06-30'), 3)
  return specs
}

function objectFor(db: Db, rng: Rng, taxpayer: Taxpayer, spec: Spec, seq: { n: number }, index = 0): TaxObject | undefined {
  const taxCode = objectTaxCode(spec.group)
  if (!taxCode) return undefined
  const type = TAX_TYPE_BY_CODE[taxCode]
  const category = spec.category ?? (spec.group === 'homestay' ? 'Homestay' : rng.pick(type.categories))
  const distrik = db.regions.find((r) => r.id === taxpayer.distrikId)!
  const kampung = distrik.kampung.find((k) => k.id === taxpayer.kampungId)!
  const [lat, lng] = CENTERS[distrik.id] ?? [-0.5, 130.5]
  const name =
    index === 0 ? taxpayer.name : spec.group === 'reklame' ? `${taxpayer.name} · Titik ${index + 1}` : `${taxpayer.name} ${index + 1}`
  seq.n += 1
  return {
    id: `obj-${String(seq.n).padStart(5, '0')}`,
    taxpayerId: taxpayer.id,
    taxCode,
    name,
    category,
    address: `${kampung.name}, Distrik ${distrik.name}`,
    distrikId: distrik.id,
    kampungId: kampung.id,
    latitude: Number((lat + rng.between(-0.04, 0.04)).toFixed(5)),
    longitude: Number((lng + rng.between(-0.04, 0.04)).toFixed(5)),
    capacity: spec.capacity,
    averageRate: spec.averageRate,
    startedAt: addDays(taxpayer.registeredAt, -rng.int(0, 60)),
    status: 'active',
    reportingRequired: false,
  }
}

export function seedTaxpayers(db: Db, rng: Rng) {
  const specs = buildSpecs(rng)
  const objSeq = { n: 0 }
  const created: Array<{ taxpayer: Taxpayer; spec: Spec }> = []

  specs.forEach((spec, i) => {
    const distrikId = spec.distrikId ?? pickDistrik(rng, spec.group)
    const distrik = db.regions.find((r) => r.id === distrikId)!
    const kampung = spec.kampungId ? distrik.kampung.find((k) => k.id === spec.kampungId)! : rng.pick(distrik.kampung)
    const owner = personName(rng)
    const isBadan =
      spec.type === 'badan' ||
      (spec.type === undefined &&
        (['resort', 'mblb', 'airtanah', 'listrik', 'walet', 'parkir'].includes(spec.group)
          ? rng.chance(0.8)
          : spec.group === 'hiburan'
            ? rng.chance(0.5)
            : false))
    const type: TaxpayerType = isBadan ? 'badan' : 'pribadi'

    let name = spec.name
    if (!name) {
      switch (spec.group) {
        case 'homestay':
          name = homestayName(rng, kampung.name)
          break
        case 'resort':
          name = resortName(rng, spec.category ?? 'Resort')
          break
        case 'restaurant':
          name = restaurantName(rng, spec.category ?? 'Rumah makan', kampung.name)
          break
        case 'mblb':
          name = businessName(rng, 'CV', 'Galian')
          break
        case 'reklame':
          name = businessName(rng, rng.pick(['CV', 'PT', 'Toko', 'UD']), 'Advertising')
          break
        case 'airtanah':
          name = businessName(rng, rng.pick(['CV', 'PT']), rng.pick(['Es Balok', 'Air Bersih', 'Air Isi Ulang']))
          break
        case 'walet':
          name = `Walet ${surname(rng)}`
          break
        case 'parkir':
          name = `Koperasi Parkir ${kampung.name}`
          break
        case 'hiburan':
          name = rng.pick(['Karaoke', 'Bar', 'Rental Diving', 'Panggung']) + ` ${businessName(rng, '', '').trim()} ${kampung.name}`
          break
        case 'listrik':
          name = `Daya Listrik ${rng.pick(['Pulau', 'Resort', 'Mandiri'])} ${kampung.name}`
          break
        default:
          name = owner
      }
    }

    const registeredAt =
      spec.registeredAt ?? (rng.chance(0.8) ? randomDate(rng, '2018-06-01', '2025-11-30') : randomDate(rng, '2025-12-01', '2026-09-30'))
    const status: TaxpayerStatus = spec.status ?? 'active'
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '')

    const taxpayer: Taxpayer = {
      id: `wp-${String(i + 1).padStart(4, '0')}`,
      type,
      name,
      ownerName: spec.group === 'individual' && !spec.name ? name : owner,
      nik: type === 'pribadi' ? nik(rng) : undefined,
      npwp: type === 'badan' ? `${digits(rng, 16)}` : undefined,
      phone: phone(rng),
      email: rng.chance(0.35) ? `${slug.slice(0, 24)}@mail.test` : undefined,
      address: `${kampung.name}, Distrik ${distrik.name}, Kabupaten Raja Ampat`,
      distrikId: distrik.id,
      kampungId: kampung.id,
      status,
      registeredAt,
    }

    if (spec.group === 'homestay') {
      spec.capacity ??= rng.int(3, 14)
      spec.averageRate ??= Math.round(rng.between(350_000, 1_200_000) / 50_000) * 50_000
    }
    if (spec.group === 'resort') {
      spec.capacity ??= rng.int(8, 40)
      spec.averageRate ??= Math.round(rng.between(1_500_000, 9_000_000) / 100_000) * 100_000
    }
    if (spec.group === 'restaurant') {
      spec.capacity ??= rng.int(12, 80)
      spec.averageRate ??= Math.round(rng.between(35_000, 150_000) / 5_000) * 5_000
    }

    addTaxpayer(db, taxpayer)
    created.push({ taxpayer, spec })

    const objectCount = spec.group === 'reklame' ? rng.int(1, 3) : spec.group === 'individual' ? 0 : 1
    for (let k = 0; k < objectCount; k++) {
      const object = objectFor(db, rng, taxpayer, spec, objSeq, k)
      if (object) {
        if (status === 'suspended' || status === 'closed') object.status = 'inactive'
        addObject(db, object)
      }
    }
  })

  const operators = db.users.filter((u) => u.roleId === 'operator_pendataan')
  const numbered = created
    .filter(({ taxpayer }) => ['active', 'suspended', 'closed'].includes(taxpayer.status))
    .sort((a, b) => a.taxpayer.registeredAt.localeCompare(b.taxpayer.registeredAt))
  numbered.forEach(({ taxpayer, spec }, idx) => {
    const golongan = spec.group === 'resort' ? 1 : 2
    const d = db.regions.find((r) => r.id === taxpayer.distrikId)!
    const k = d.kampung.find((x) => x.id === taxpayer.kampungId)!
    taxpayer.npwpd = `${taxpayer.type === 'badan' ? 'B' : 'P'}.${golongan}.${String(idx + 1).padStart(7, '0')}.${d.code}.${k.code}`
    taxpayer.approvedAt = addDays(taxpayer.registeredAt, 3)
    taxpayer.approvedBy = rng.pick(operators).name
  })
  db.counters.set('npwpd', numbered.length)

  let required = 0
  for (const o of db.objects) {
    const tp = db.taxpayerById.get(o.taxpayerId)
    if (!tp || tp.status !== 'active' || o.category === 'Homestay') continue
    const self = TAX_TYPE_BY_CODE[o.taxCode]?.assessment === 'self'
    if (self && tp.registeredAt < '2026-09-01') {
      o.reportingRequired = true
      required += 1
    }
  }

  const homestayObjects = db.objects
    .filter((o) => o.category === 'Homestay' && db.taxpayerById.get(o.taxpayerId)?.status === 'active')
    .sort((a, b) => (b.capacity ?? 0) * (b.averageRate ?? 0) - (a.capacity ?? 0) * (a.averageRate ?? 0))
  homestayObjects.slice(0, Math.max(REQUIRED_TOTAL - required, 0)).forEach((o) => (o.reportingRequired = true))
}
