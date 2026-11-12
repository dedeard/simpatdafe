import { DEMO_NOW, TODAY } from '@/lib/dates'
import { bphtbCalc } from '@/lib/tax'
import { BPHTB_TYPE_LABEL, PPAT_LIST, REQUIRED_ATTACHMENTS, type BphtbFiling, type BphtbInput, type BphtbRow } from '../../resources/bphtb'
import type { TableQuery } from '../../resources/common'
import { docNo, filterValue, getDb, kampungLabel, matches, paginate, regionName, type Db } from '../db'
import { assert } from '../lookup'

function row(db: Db, f: BphtbFiling): BphtbRow {
  const o = db.pbbObjects.find((x) => x.nop === f.nop)
  return {
    ...f,
    location: o ? `${kampungLabel(db, o.distrikId, o.kampungId)}, ${regionName(db, o.distrikId)}` : '-',
    belowNjop: f.declaredPrice < f.njop,
  }
}

function requireFiling(db: Db, id: string) {
  const f = db.bphtb.find((x) => x.id === id)
  assert(f, 'Pengajuan BPHTB tidak ditemukan.')
  return f
}

export const bphtbHandlers = {
  'bphtb.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const status = filterValue(query, 'status')
    const type = filterValue(query, 'type')
    const ppat = filterValue(query, 'ppat')
    const from = filterValue(query, 'from')
    const to = filterValue(query, 'to')
    const filtered = db.bphtb
      .filter((f) => !status || f.status === status)
      .filter((f) => !type || f.transactionType === type)
      .filter((f) => !ppat || f.ppat === ppat)
      .filter((f) => (!from || f.submittedAt.slice(0, 10) >= from) && (!to || f.submittedAt.slice(0, 10) <= to))
      .filter((f) => matches(`${f.id} ${f.nop} ${f.buyer.name} ${f.seller.name}`, query.q))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    const stats = {
      total: filtered.length,
      pending: filtered.filter((f) => f.status === 'submitted').length,
      amount: filtered.filter((f) => f.status === 'paid' || f.status === 'validated').reduce((s, f) => s + f.amount, 0),
    }
    const page = paginate(filtered, query, stats)
    return { ...page, rows: page.rows.map((f) => row(db, f)) }
  },

  'bphtb.get': async (id: string) => {
    const db = await getDb()
    const f = requireFiling(db, id)
    const object = db.pbbObjects.find((o) => o.nop === f.nop)
    return {
      filing: row(db, f),
      object: object ? { ownerName: object.ownerName, address: object.objectAddress, use: object.use } : undefined,
    }
  },

  'bphtb.lookupNop': async (q: string) => {
    const db = await getDb()
    if (q.trim().length < 3) return []
    return db.pbbObjects
      .filter((o) => matches(`${o.nop} ${o.ownerName}`, q))
      .slice(0, 8)
      .map((o) => ({
        nop: o.nop,
        ownerName: o.ownerName,
        address: `${kampungLabel(db, o.distrikId, o.kampungId)}, ${regionName(db, o.distrikId)}`,
        landArea: o.landArea,
        buildingArea: o.buildingArea,
        njop: o.njop,
      }))
  },

  'bphtb.create': async (input: BphtbInput) => {
    const db = await getDb()
    const object = db.pbbObjects.find((o) => o.nop === input.nop)
    assert(object, 'NOP tidak ditemukan di data PBB-P2.')
    assert(input.buyer.name.trim() && input.seller.name.trim(), 'Nama pembeli dan penjual wajib diisi.')
    assert(/^\d{16}$/.test(input.buyer.nik), 'NIK pembeli harus 16 digit.')
    assert(input.declaredPrice > 0, 'Harga transaksi harus lebih dari nol.')
    if (input.transactionType !== 'waris')
      assert(input.ppat && (PPAT_LIST as ReadonlyArray<string>).includes(input.ppat), 'PPAT wajib dipilih.')
    for (const required of REQUIRED_ATTACHMENTS) assert(input.attachments.includes(required), `Lampiran wajib: ${required}.`)
    const calc = bphtbCalc({ price: input.declaredPrice, njop: object.njop, transactionType: input.transactionType }, db.tariffs, TODAY)
    const filing: BphtbFiling = {
      id: docNo(db, 'BPHTB', TODAY),
      nop: object.nop,
      transactionType: input.transactionType,
      buyer: { ...input.buyer, name: input.buyer.name.trim() },
      seller: { ...input.seller, name: input.seller.name.trim() },
      ppat: input.ppat,
      landArea: object.landArea,
      buildingArea: object.buildingArea,
      declaredPrice: input.declaredPrice,
      njop: object.njop,
      npop: calc.npop,
      npoptkp: calc.npoptkp,
      npopkp: calc.npopkp,
      rate: calc.rate,
      amount: calc.amount,
      status: 'submitted',
      attachments: input.attachments,
      submittedAt: DEMO_NOW,
      verificationNote: calc.belowNjop ? 'Harga transaksi di bawah NJOP, dasar pengenaan memakai NJOP.' : undefined,
    }
    db.bphtb.push(filing)
    return { id: filing.id }
  },

  'bphtb.decide': async (input: { id: string; action: 'verify' | 'reject' | 'validate'; note?: string; adjustedNpop?: number }) => {
    const db = await getDb()
    const f = requireFiling(db, input.id)
    if (input.action === 'verify') {
      assert(f.status === 'submitted', 'Hanya pengajuan berstatus Diajukan yang dapat diverifikasi.')
      if (input.adjustedNpop !== undefined) {
        assert(input.note?.trim(), 'Catatan wajib diisi saat menyesuaikan NPOP.')
        const calc = bphtbCalc({ price: input.adjustedNpop, njop: f.njop, transactionType: f.transactionType }, db.tariffs, TODAY)
        Object.assign(f, { declaredPrice: input.adjustedNpop, npop: calc.npop, npopkp: calc.npopkp, amount: calc.amount })
      }
      assert(f.amount > 0 || f.transactionType === 'waris' || f.transactionType === 'hibah', 'BPHTB terutang nol, tidak perlu pembayaran.')
      f.status = 'verified'
      f.verificationNote = input.note?.trim() || f.verificationNote
    } else if (input.action === 'reject') {
      assert(f.status === 'submitted' || f.status === 'verified', 'Pengajuan tidak dapat ditolak dari status ini.')
      const reason = input.note?.trim()
      assert(reason, 'Alasan penolakan wajib diisi.')
      f.status = 'rejected'
      f.verificationNote = reason
    } else {
      assert(f.status === 'paid', 'Validasi hanya untuk pengajuan yang sudah dibayar.')
      f.status = 'validated'
      f.validatedAt = DEMO_NOW
      const object = db.pbbObjects.find((o) => o.nop === f.nop)
      if (object) {
        object.ownerName = f.buyer.name
        object.ownerNik = f.buyer.nik
        object.ownershipHistory.push({ owner: f.buyer.name, from: TODAY, source: `${BPHTB_TYPE_LABEL[f.transactionType]} · ${f.id}` })
      }
    }
    return { id: f.id, status: f.status }
  },
}
