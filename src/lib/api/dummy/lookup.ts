import { TODAY } from '@/lib/dates'
import type { Sspd, SspdStatus } from '../resources/payments'
import { sectorOf } from '../resources/reference'
import type { Taxpayer } from '../resources/taxpayers'
import { fail, kampungLabel, regionName, requireObject, requireTaxpayer, type Db } from './db'

export const ACTOR = 'Admin Demo'

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message)
}

export function taxpayerName(db: Db, id?: string) {
  return id ? (db.taxpayerById.get(id)?.name ?? '-') : '-'
}

export function taxpayerNpwpd(db: Db, id?: string) {
  return id ? db.taxpayerById.get(id)?.npwpd : undefined
}

export function objectName(db: Db, id: string) {
  return db.objectById.get(id)?.name ?? '-'
}

export function mainObject(db: Db, taxpayerId: string) {
  return db.objects.find((o) => o.taxpayerId === taxpayerId)
}

export function sectorOfTaxpayer(db: Db, taxpayer: Taxpayer) {
  const main = mainObject(db, taxpayer.id)
  return sectorOf(main?.taxCode, main?.category)
}

export function distrikOfTaxpayer(db: Db, id?: string) {
  const t = id ? db.taxpayerById.get(id) : undefined
  return t ? regionName(db, t.distrikId) : '-'
}

export function placeLabel(db: Db, distrikId: string, kampungId: string) {
  return `${kampungLabel(db, distrikId, kampungId)}, ${regionName(db, distrikId)}`
}

export function sspdStatus(s: Sspd): SspdStatus {
  return s.status === 'pending' && s.expiresAt.slice(0, 10) < TODAY ? 'expired' : s.status
}

export function validateObjectOwner(db: Db, taxpayerId: string, objectId: string) {
  const taxpayer = requireTaxpayer(db, taxpayerId)
  const object = requireObject(db, objectId)
  assert(object.taxpayerId === taxpayer.id, 'Objek pajak bukan milik wajib pajak ini.')
  assert(taxpayer.status === 'active', 'Wajib pajak harus berstatus Aktif.')
  return { taxpayer, object }
}

export function isoNow(local: string) {
  return local.length === 16 ? `${local}:00+09:00` : local
}
