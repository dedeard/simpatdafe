import { TODAY } from '@/lib/dates'
import { tariffValue } from '@/lib/tax'
import type { TableQuery } from '../../resources/common'
import { SERVICE_META, type PortBill, type PortBillRow, type PortInput, type Vessel } from '../../resources/port'
import { docNo, filterValue, getDb, matches, paginate, type Db } from '../db'
import { assert } from '../lookup'

function toRow(db: Db, b: PortBill): PortBillRow {
  const vessel = db.vessels.find((v) => v.id === b.vesselId)
  return { ...b, vesselName: vessel?.name ?? 'Penumpang umum', vesselType: vessel?.type }
}

export const portHandlers = {
  'port.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const port = filterValue(query, 'port')
    const type = filterValue(query, 'type')
    const service = filterValue(query, 'service')
    const from = filterValue(query, 'from')
    const to = filterValue(query, 'to')
    const vesselOf = (b: PortBill) => db.vessels.find((v) => v.id === b.vesselId)
    const filtered = db.portBills
      .filter((b) => !port || b.port === port)
      .filter((b) => !type || vesselOf(b)?.type === type)
      .filter((b) => !service || b.items.some((i) => i.service === service))
      .filter((b) => (!from || b.serviceDate >= from) && (!to || b.serviceDate <= to))
      .filter((b) => matches(`${b.id} ${vesselOf(b)?.name ?? ''}`, query.q))
      .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate) || b.id.localeCompare(a.id))
    const today = db.portBills.filter((b) => b.serviceDate === TODAY)
    const stats = {
      passengersToday: today.reduce((s, b) => s + (b.items.find((i) => i.service === 'pas_penumpang')?.quantity ?? 0), 0),
      vesselsToday: new Set(today.map((b) => b.vesselId)).size,
      amountToday: today.reduce((s, b) => s + b.total, 0),
      amountYtd: db.portBills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0),
    }
    const page = paginate(filtered, query, stats)
    return { ...page, rows: page.rows.map((b) => toRow(db, b)) }
  },

  'port.get': async (id: string) => {
    const db = await getDb()
    const b = db.portBills.find((x) => x.id === id)
    assert(b, 'Tagihan pelabuhan tidak ditemukan.')
    return { ...toRow(db, b), vessel: db.vessels.find((v) => v.id === b.vesselId) }
  },

  'port.create': async (input: PortInput) => {
    const db = await getDb()
    assert(input.serviceDate <= TODAY, 'Tanggal layanan tidak boleh di masa depan.')
    assert(input.items.length > 0, 'Minimal satu layanan.')
    const vessel = input.vesselId ? db.vessels.find((v) => v.id === input.vesselId) : undefined
    const onlyPass = input.items.every((i) => i.service === 'pas_penumpang')
    assert(vessel || onlyPass, 'Pilih kapal untuk layanan selain pas penumpang.')
    const items = input.items.map((i) => {
      assert(i.quantity > 0, `Jumlah ${SERVICE_META[i.service].label} harus lebih dari nol.`)
      const unitPrice = tariffValue(db.tariffs, `port.${i.service}`, input.serviceDate)
      return {
        service: i.service,
        quantity: i.quantity,
        unit: SERVICE_META[i.service].unit,
        unitPrice,
        amount: Math.round(i.quantity * unitPrice),
      }
    })
    const bill: PortBill = {
      id: docNo(db, 'PORT', input.serviceDate),
      port: input.port,
      vesselId: vessel?.id,
      items,
      total: items.reduce((s, i) => s + i.amount, 0),
      serviceDate: input.serviceDate,
      status: 'unpaid',
    }
    db.portBills.push(bill)
    return { id: bill.id }
  },

  'port.vessels': async (query: TableQuery = {}) => {
    const db = await getDb()
    const type = filterValue(query, 'type')
    const visits = new Map<string, number>()
    for (const b of db.portBills) if (b.vesselId) visits.set(b.vesselId, (visits.get(b.vesselId) ?? 0) + 1)
    const rows = db.vessels
      .filter((v) => !type || v.type === type)
      .filter((v) => matches(`${v.name} ${v.owner}`, query.q))
      .map((v) => ({ ...v, visits: visits.get(v.id) ?? 0 }))
      .sort((a, b) => b.visits - a.visits)
    return paginate(rows, query)
  },

  'port.createVessel': async (input: Omit<Vessel, 'id'>) => {
    const db = await getDb()
    assert(input.name.trim(), 'Nama kapal wajib diisi.')
    assert(input.grossTonnage > 0, 'GT harus lebih dari nol.')
    assert(input.owner.trim(), 'Pemilik wajib diisi.')
    const vessel: Vessel = {
      ...input,
      name: input.name.trim(),
      owner: input.owner.trim(),
      id: `ves-${String(db.vessels.length + 1).padStart(2, '0')}`,
    }
    db.vessels.push(vessel)
    return { id: vessel.id, name: vessel.name }
  },
}
