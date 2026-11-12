import { monthKey, TODAY } from '@/lib/dates'
import type { TableQuery } from '../../resources/common'
import { revenueName, sectorOf, TAX_TYPE_BY_CODE } from '../../resources/reference'
import type {
  ObjectInput,
  TaxObject,
  TaxObjectRow,
  Taxpayer,
  TaxpayerDecision,
  TaxpayerHistory,
  TaxpayerInput,
  TaxpayerPick,
  TaxpayerRow,
} from '../../resources/taxpayers'
import {
  addObject,
  addTaxpayer,
  filterValue,
  getDb,
  kampungLabel,
  matches,
  nextSeq,
  paginate,
  regionName,
  requireTaxpayer,
  type Db,
} from '../db'
import { ACTOR, assert, sspdStatus } from '../lookup'

function objectRow(db: Db, o: TaxObject): TaxObjectRow {
  return {
    ...o,
    taxName: revenueName(o.taxCode),
    distrik: regionName(db, o.distrikId),
    kampung: kampungLabel(db, o.distrikId, o.kampungId),
  }
}

function taxpayerRow(db: Db, t: Taxpayer, objects: Map<string, Array<TaxObject>>): TaxpayerRow {
  const own = objects.get(t.id) ?? []
  const main = own[0]
  return {
    ...t,
    distrik: regionName(db, t.distrikId),
    kampung: kampungLabel(db, t.distrikId, t.kampungId),
    sector: sectorOf(main?.taxCode, main?.category),
    objectCount: own.length,
  }
}

function groupObjects(db: Db) {
  const map = new Map<string, Array<TaxObject>>()
  for (const o of db.objects) {
    const list = map.get(o.taxpayerId)
    if (list) list.push(o)
    else map.set(o.taxpayerId, [o])
  }
  return map
}

function validateTaxpayerInput(input: Omit<TaxpayerInput, 'object'>) {
  assert(input.name.trim().length >= 3, 'Nama minimal 3 karakter.')
  assert(input.ownerName.trim().length > 0, 'Nama pemilik wajib diisi.')
  assert(/^(08|\+62)\d{8,12}$/.test(input.phone.replace(/[\s-]/g, '')), 'Nomor telepon tidak valid.')
  if (input.type === 'pribadi') assert(/^\d{16}$/.test(input.nik ?? ''), 'NIK harus 16 digit.')
  if (input.type === 'badan') assert(/^\d{16}$/.test(input.npwp ?? ''), 'NPWP harus 16 digit.')
  if (input.email) assert(/^\S+@\S+\.\S+$/.test(input.email), 'Format email tidak valid.')
  assert(input.address.trim().length > 0, 'Alamat wajib diisi.')
}

function buildObject(db: Db, taxpayer: Taxpayer, input: ObjectInput): TaxObject {
  const type = TAX_TYPE_BY_CODE[input.taxCode]
  assert(type, 'Jenis pajak tidak dikenal.')
  assert(input.name.trim().length > 0, 'Nama objek wajib diisi.')
  assert(input.startedAt <= TODAY, 'Tanggal mulai tidak boleh di masa depan.')
  if (input.latitude !== undefined) assert(input.latitude >= -2.5 && input.latitude <= 0.5, 'Lintang di luar wilayah Raja Ampat.')
  if (input.longitude !== undefined) assert(input.longitude >= 129.5 && input.longitude <= 131.5, 'Bujur di luar wilayah Raja Ampat.')
  const distrikId = input.distrikId ?? taxpayer.distrikId
  const kampungId = input.kampungId ?? taxpayer.kampungId
  return {
    id: `obj-${String(db.objects.length + 1).padStart(5, '0')}`,
    taxpayerId: taxpayer.id,
    taxCode: input.taxCode,
    name: input.name.trim(),
    category: input.category,
    address: input.address?.trim() || `${kampungLabel(db, distrikId, kampungId)}`,
    distrikId,
    kampungId,
    latitude: input.latitude,
    longitude: input.longitude,
    capacity: input.capacity,
    averageRate: input.averageRate,
    startedAt: input.startedAt,
    status: 'active',
    reportingRequired: false,
  }
}

export const taxpayerHandlers = {
  'taxpayers.list': async (query: TableQuery = {}) => {
    const db = await getDb()
    const objects = groupObjects(db)
    const status = filterValue(query, 'status')
    const distrik = filterValue(query, 'distrik')
    const sector = filterValue(query, 'sector')
    const rows = db.taxpayers
      .filter((t) => !status || t.status === status)
      .filter((t) => !distrik || t.distrikId === distrik)
      .filter((t) => matches(`${t.npwpd ?? ''} ${t.name} ${t.ownerName}`, query.q))
      .map((t) => taxpayerRow(db, t, objects))
      .filter((r) => !sector || r.sector === sector)
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt) || a.name.localeCompare(b.name))
    const stats = {
      active: db.taxpayers.filter((t) => t.status === 'active').length,
      verification: db.taxpayers.filter((t) => t.status === 'verification').length,
      newThisMonth: db.taxpayers.filter((t) => t.status !== 'draft' && monthKey(t.registeredAt) === monthKey(TODAY)).length,
    }
    return paginate(rows, query, stats)
  },

  'taxpayers.get': async (id: string) => {
    const db = await getDb()
    const taxpayer = requireTaxpayer(db, id)
    const objects = groupObjects(db)
    return {
      taxpayer: taxpayerRow(db, taxpayer, objects),
      objects: (objects.get(id) ?? []).map((o) => objectRow(db, o)),
    }
  },

  'taxpayers.create': async (input: TaxpayerInput) => {
    const db = await getDb()
    validateTaxpayerInput(input)
    assert(
      db.regions.find((r) => r.id === input.distrikId)?.kampung.some((k) => k.id === input.kampungId),
      'Kampung tidak sesuai distrik.',
    )
    const taxpayer: Taxpayer = {
      id: `wp-${String(db.taxpayers.length + 1).padStart(4, '0')}`,
      type: input.type,
      name: input.name.trim(),
      ownerName: input.ownerName.trim(),
      nik: input.type === 'pribadi' ? input.nik : undefined,
      npwp: input.type === 'badan' ? input.npwp : undefined,
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      address: input.address.trim(),
      distrikId: input.distrikId,
      kampungId: input.kampungId,
      status: 'verification',
      registeredAt: TODAY,
    }
    const object = buildObject(db, taxpayer, input.object)
    addTaxpayer(db, taxpayer)
    addObject(db, object)
    return { id: taxpayer.id }
  },

  'taxpayers.update': async (input: Partial<Omit<TaxpayerInput, 'object'>> & { id: string }) => {
    const db = await getDb()
    const taxpayer = requireTaxpayer(db, input.id)
    const merged = { ...taxpayer, ...input }
    validateTaxpayerInput(merged as Omit<TaxpayerInput, 'object'>)
    Object.assign(taxpayer, {
      name: merged.name.trim(),
      ownerName: merged.ownerName.trim(),
      phone: merged.phone.trim(),
      email: merged.email?.trim() || undefined,
      address: merged.address.trim(),
      distrikId: merged.distrikId,
      kampungId: merged.kampungId,
      nik: taxpayer.type === 'pribadi' ? merged.nik : undefined,
      npwp: taxpayer.type === 'badan' ? merged.npwp : undefined,
    })
    return { id: taxpayer.id }
  },

  'taxpayers.decide': async (input: { id: string; action: TaxpayerDecision; reason?: string }) => {
    const db = await getDb()
    const t = requireTaxpayer(db, input.id)
    switch (input.action) {
      case 'approve': {
        assert(t.status === 'verification', 'Hanya WP berstatus Verifikasi yang dapat disetujui.')
        const seq = nextSeq(db, 'npwpd')
        const d = db.regions.find((r) => r.id === t.distrikId)!
        const k = d.kampung.find((x) => x.id === t.kampungId)!
        const main = db.objects.find((o) => o.taxpayerId === t.id)
        const golongan = main && ['Resort', 'Hotel', 'Dive lodge', 'Liveaboard'].includes(main.category) ? 1 : 2
        t.npwpd = `${t.type === 'badan' ? 'B' : 'P'}.${golongan}.${String(seq).padStart(7, '0')}.${d.code}.${k.code}`
        t.status = 'active'
        t.approvedAt = TODAY
        t.approvedBy = ACTOR
        t.rejectionReason = undefined
        break
      }
      case 'reject':
        assert(t.status === 'verification', 'Hanya WP berstatus Verifikasi yang dapat ditolak.')
        {
          const reason = input.reason?.trim()
          assert(reason, 'Alasan penolakan wajib diisi.')
          t.status = 'draft'
          t.rejectionReason = reason
        }
        break
      case 'suspend':
        assert(t.status === 'active', 'Hanya WP aktif yang dapat dinonaktifkan.')
        t.status = 'suspended'
        break
      case 'reactivate':
        assert(t.status === 'suspended', 'Hanya WP non-aktif sementara yang dapat diaktifkan kembali.')
        t.status = 'active'
        break
      case 'close':
        assert(t.status === 'active' || t.status === 'suspended', 'WP tidak dapat ditutup dari status ini.')
        assert(input.reason?.trim(), 'Alasan penutupan wajib diisi.')
        t.status = 'closed'
        for (const o of db.objects) if (o.taxpayerId === t.id) o.status = 'inactive'
        break
    }
    return { id: t.id, status: t.status, npwpd: t.npwpd }
  },

  'taxpayers.addObject': async (input: { taxpayerId: string; object: ObjectInput }) => {
    const db = await getDb()
    const taxpayer = requireTaxpayer(db, input.taxpayerId)
    assert(taxpayer.status !== 'closed', 'WP yang sudah tutup tidak dapat menambah objek.')
    const object = buildObject(db, taxpayer, input.object)
    addObject(db, object)
    return { id: object.id }
  },

  'taxpayers.search': async (input: { q: string; onlyActive?: boolean }): Promise<Array<TaxpayerPick>> => {
    const db = await getDb()
    const onlyActive = input.onlyActive ?? true
    return db.taxpayers
      .filter((t) => (!onlyActive || t.status === 'active') && matches(`${t.npwpd ?? ''} ${t.name} ${t.ownerName}`, input.q))
      .slice(0, 12)
      .map((t) => ({
        id: t.id,
        npwpd: t.npwpd ?? '-',
        name: t.name,
        ownerName: t.ownerName,
        distrik: regionName(db, t.distrikId),
        type: t.type,
      }))
  },

  'taxpayers.history': async (id: string): Promise<TaxpayerHistory> => {
    const db = await getDb()
    requireTaxpayer(db, id)
    return {
      sptpd: db.sptpd
        .filter((s) => s.taxpayerId === id)
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, 30)
        .map((s) => ({
          id: s.id,
          period: s.period,
          taxName: revenueName(s.taxCode),
          taxDue: s.taxDue,
          status: s.status,
          paid: Boolean(s.paidAt),
        })),
      assessments: db.assessments
        .filter((a) => a.taxpayerId === id)
        .slice(-20)
        .map((a) => ({ id: a.id, kind: a.kind, taxName: revenueName(a.taxCode), total: a.total, status: a.status })),
      payments: db.sspd
        .filter((s) => s.taxpayerId === id)
        .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt))
        .slice(0, 30)
        .map((s) => ({ id: s.id, revenue: revenueName(s.revenueCode), amount: s.amount, paidAt: s.paidAt, status: sspdStatus(s) })),
      stpd: db.stpd.filter((s) => s.taxpayerId === id).map((s) => ({ id: s.id, total: s.total, status: s.status })),
    }
  },
}
