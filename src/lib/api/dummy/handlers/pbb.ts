import { TODAY } from '@/lib/dates'
import { tariffValue } from '@/lib/tax'
import type { TableQuery } from '../../resources/common'
import {
  BUILDING_CLASSES,
  LAND_CLASSES,
  type PbbObject,
  type PbbObjectInput,
  type PbbObjectRow,
  type Sppt,
  type SpptRow,
} from '../../resources/pbb'
import { filterValue, getDb, kampungLabel, matches, paginate, regionName, type Db } from '../db'
import { assert } from '../lookup'
import { buildNop, computeSpptAmounts, recomputeNjop } from '../seed/property'

function spptStatus(s: Sppt): SpptRow['status'] {
  return s.status === 'issued' && s.dueDate < TODAY && s.amount > 0 ? 'overdue' : s.status
}

function spptRow(db: Db, s: Sppt): SpptRow {
  const o = db.pbbObjects.find((x) => x.nop === s.nop)
  return {
    ...s,
    status: spptStatus(s),
    ownerName: o?.ownerName ?? '-',
    location: o ? `${kampungLabel(db, o.distrikId, o.kampungId)}, ${regionName(db, o.distrikId)}` : '-',
  }
}

function objectRow(db: Db, o: PbbObject, current?: Sppt): PbbObjectRow {
  return {
    ...o,
    distrik: regionName(db, o.distrikId),
    kampung: kampungLabel(db, o.distrikId, o.kampungId),
    currentSppt: current ? spptRow(db, current) : undefined,
  }
}

function stats(db: Db, year: number) {
  const list = db.sppt.filter((s) => s.year === year)
  return {
    objects: db.pbbObjects.length,
    njop: db.pbbObjects.reduce((s, o) => s + o.njop, 0),
    issuedAmount: list.reduce((s, x) => s + x.amount, 0),
    paidAmount: list.filter((x) => x.status === 'paid').reduce((s, x) => s + x.amount, 0),
  }
}

export const pbbHandlers = {
  'pbb.objects': async (query: TableQuery = {}) => {
    const db = await getDb()
    const year = Number(filterValue(query, 'year') ?? 2026)
    const distrik = filterValue(query, 'distrik')
    const kampung = filterValue(query, 'kampung')
    const use = filterValue(query, 'use')
    const status = filterValue(query, 'status')
    const spptByNop = new Map(db.sppt.filter((s) => s.year === year).map((s) => [s.nop, s]))
    const filtered = db.pbbObjects
      .filter((o) => !distrik || o.distrikId === distrik)
      .filter((o) => !kampung || o.kampungId === kampung)
      .filter((o) => !use || o.use === use)
      .filter((o) => !status || (spptByNop.get(o.nop) && spptStatus(spptByNop.get(o.nop)!) === status))
      .filter((o) => matches(`${o.nop} ${o.ownerName} ${o.objectAddress}`, query.q))
    const page = paginate(filtered, query, stats(db, year))
    return { ...page, rows: page.rows.map((o) => objectRow(db, o, spptByNop.get(o.nop))) }
  },

  'pbb.object': async (nop: string) => {
    const db = await getDb()
    const o = db.pbbObjects.find((x) => x.nop === nop)
    assert(o, 'Objek pajak tidak ditemukan.')
    const history = db.sppt.filter((s) => s.nop === nop).sort((a, b) => b.year - a.year)
    return { object: objectRow(db, o, history[0]), sppt: history.map((s) => spptRow(db, s)) }
  },

  'pbb.createObject': async (input: PbbObjectInput) => {
    const db = await getDb()
    assert(input.ownerName.trim() && input.ownerAddress.trim() && input.objectAddress.trim(), 'Data pemilik dan alamat wajib diisi.')
    assert(/^\d{16}$/.test(input.ownerNik), 'NIK harus 16 digit.')
    assert(input.landArea > 0, 'Luas tanah harus lebih dari nol.')
    assert(input.buildingArea >= 0, 'Luas bangunan tidak boleh negatif.')
    assert(
      db.regions.find((r) => r.id === input.distrikId)?.kampung.some((k) => k.id === input.kampungId),
      'Kampung tidak sesuai distrik.',
    )
    const land = LAND_CLASSES.find((c) => c.value === input.landClass)
    assert(land, 'Kelas tanah tidak valid.')
    const building = BUILDING_CLASSES.find((c) => c.value === input.buildingClass)
    assert(input.buildingArea === 0 || building, 'Kelas bangunan wajib diisi.')
    const object: PbbObject = {
      nop: buildNop(db, input.distrikId, input.kampungId, db.pbbObjects.length + 1),
      ownerName: input.ownerName.trim(),
      ownerNik: input.ownerNik,
      ownerAddress: input.ownerAddress.trim(),
      objectAddress: input.objectAddress.trim(),
      distrikId: input.distrikId,
      kampungId: input.kampungId,
      landArea: input.landArea,
      buildingArea: input.buildingArea,
      landClass: input.landClass,
      buildingClass: input.buildingClass,
      landValuePerM2: land.perM2,
      buildingValuePerM2: building?.perM2 ?? 0,
      njop: 0,
      use: input.use,
      ownershipHistory: [{ owner: input.ownerName.trim(), from: TODAY, source: 'Pendaftaran SPOP' }],
    }
    recomputeNjop(object)
    db.pbbObjects.push(object)
    return { nop: object.nop }
  },

  'pbb.sppt': async (query: TableQuery = {}) => {
    const db = await getDb()
    const year = Number(filterValue(query, 'year') ?? 2026)
    const status = filterValue(query, 'status')
    const distrik = filterValue(query, 'distrik')
    const filtered = db.sppt
      .filter((s) => s.year === year)
      .filter((s) => !status || spptStatus(s) === status)
      .filter((s) => {
        if (!distrik) return true
        return db.pbbObjects.find((o) => o.nop === s.nop)?.distrikId === distrik
      })
      .filter((s) => {
        if (!query.q) return true
        const o = db.pbbObjects.find((x) => x.nop === s.nop)
        return matches(`${s.nop} ${o?.ownerName ?? ''}`, query.q)
      })
      .sort((a, b) => b.amount - a.amount)
    const page = paginate(filtered, query, stats(db, year))
    return { ...page, rows: page.rows.map((s) => spptRow(db, s)) }
  },

  'pbb.massPreview': async (year: number) => {
    const db = await getDb()
    const amounts = computeSpptAmounts(db, db.pbbObjects, year)
    const minimum = tariffValue(db.tariffs, 'pbb.min', `${year}-02-10`)
    return {
      year,
      alreadyIssued: db.sppt.some((s) => s.year === year),
      objects: amounts.length,
      totalNjop: amounts.reduce((s, x) => s + x.object.njop, 0),
      totalAmount: amounts.reduce((s, x) => s + x.calc.amount, 0),
      belowMinimum: amounts.filter((x) => x.calc.amount === minimum && x.calc.njkp > 0).length,
    }
  },

  'pbb.massIssue': async (year: number) => {
    const db = await getDb()
    assert(Number.isInteger(year) && year >= 2026 && year <= 2035, 'Tahun pajak tidak valid.')
    assert(!db.sppt.some((s) => s.year === year), `SPPT tahun ${year} sudah pernah diterbitkan.`)
    const amounts = computeSpptAmounts(db, db.pbbObjects, year)
    for (const { object, calc } of amounts) {
      db.sppt.push({
        nop: object.nop,
        year,
        njop: object.njop,
        njoptkp: calc.njoptkp,
        njkp: calc.njkp,
        rate: calc.rate,
        amount: calc.amount,
        dueDate: `${year}-09-30`,
        status: 'issued',
      })
    }
    return { count: amounts.length, total: amounts.reduce((s, x) => s + x.calc.amount, 0) }
  },
}
