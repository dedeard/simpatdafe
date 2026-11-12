import type { Role } from '../resources/access'
import type { Assessment } from '../resources/assessments'
import type { BphtbFiling } from '../resources/bphtb'
import type { Stpd } from '../resources/collections'
import { DEFAULT_PAGE_SIZE, type Page, type TableQuery } from '../resources/common'
import type { Sspd } from '../resources/payments'
import type { PbbObject, Sppt } from '../resources/pbb'
import type { PortBill, Vessel } from '../resources/port'
import type { Distrik } from '../resources/reference'
import type { Skrd } from '../resources/retributions'
import type { AppUser, RevenueTarget, Signatory, Tariff } from '../resources/settings'
import type { Sptpd } from '../resources/sptpd'
import type { TaxObject, Taxpayer } from '../resources/taxpayers'
import type { EntryTicket } from '../resources/tourism'

export type BludCount = { date: string; visitors: number }

export type Db = {
  regions: Array<Distrik>
  taxpayers: Array<Taxpayer>
  taxpayerById: Map<string, Taxpayer>
  objects: Array<TaxObject>
  objectById: Map<string, TaxObject>
  sptpd: Array<Sptpd>
  assessments: Array<Assessment>
  sspd: Array<Sspd>
  stpd: Array<Stpd>
  tickets: Array<EntryTicket>
  bludCounts: Map<string, number>
  checkedDays: Map<string, string>
  vessels: Array<Vessel>
  portBills: Array<PortBill>
  skrd: Array<Skrd>
  wasteSubscribers: Array<{ taxpayerId: string; tier: 'homestay' | 'resort' | 'restaurant' }>
  pbbObjects: Array<PbbObject>
  sppt: Array<Sppt>
  bphtb: Array<BphtbFiling>
  targets: Array<RevenueTarget>
  tariffs: Array<Tariff>
  users: Array<AppUser>
  roles: Array<Role>
  signatories: Array<Signatory>
  counters: Map<string, number>
}

type GlobalWithDb = typeof globalThis & { __simpatdaDb?: Db }

export async function getDb(): Promise<Db> {
  const g = globalThis as GlobalWithDb
  if (!g.__simpatdaDb) {
    const { buildDb } = await import('./seed')
    g.__simpatdaDb = buildDb()
  }
  if (!g.__simpatdaDb.roles) {
    // db built before roles existed (kept across hot reload)
    const { seedRoles } = await import('./seed/settings')
    g.__simpatdaDb.roles = seedRoles()
  }
  return g.__simpatdaDb
}

export function resetDb() {
  ;(globalThis as GlobalWithDb).__simpatdaDb = undefined
}

export function nextSeq(db: Db, key: string) {
  const value = (db.counters.get(key) ?? 0) + 1
  db.counters.set(key, value)
  return value
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

export type DocKind = 'SPTPD' | 'SKPD' | 'SKPDKB' | 'SSPD' | 'STPD' | 'SKRD' | 'TKT' | 'BPHTB' | 'PORT'

export function docNo(db: Db, kind: DocKind, date: string) {
  const year = date.slice(0, 4)
  const month = date.slice(5, 7)
  const seq = nextSeq(db, `${kind}:${year}`)
  switch (kind) {
    case 'SPTPD':
    case 'SSPD':
    case 'BPHTB':
    case 'TKT':
      return `${kind}/${year}/${month}/${pad(seq, 6)}`
    case 'SKPD':
    case 'SKPDKB':
    case 'STPD':
      return `${kind}/${year}/${pad(seq, 4)}`
    case 'SKRD':
      return `SKRD/${year}/${pad(seq, 5)}`
    case 'PORT':
      return `PLB/${year}/${pad(seq, 5)}`
  }
}

export function paymentCode(db: Db) {
  return `9205${pad(nextSeq(db, 'paymentCode'), 11)}`
}

export function regionName(db: Db, distrikId: string) {
  return db.regions.find((r) => r.id === distrikId)?.name ?? '-'
}

export function kampungLabel(db: Db, distrikId: string, kampungId: string) {
  return db.regions.find((r) => r.id === distrikId)?.kampung.find((k) => k.id === kampungId)?.name ?? '-'
}

export function paginate<T, S = undefined>(rows: Array<T>, query: TableQuery, stats: S = undefined as S): Page<T, S> {
  const pageSize = Math.min(Number(query.pageSize) || DEFAULT_PAGE_SIZE, 200)
  const total = rows.length
  const pages = Math.max(Math.ceil(total / pageSize), 1)
  const page = Math.min(Math.max(Number(query.page) || 1, 1), pages)
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, stats }
}

export function matches(text: string, q?: string) {
  if (!q) return true
  const needle = q.trim().toLowerCase()
  return needle === '' || text.toLowerCase().includes(needle)
}

export function filterValue(query: TableQuery, key: string) {
  const value = query[key]
  return value === undefined || value === '' || value === 'all' ? undefined : String(value)
}

export function addTaxpayer(db: Db, taxpayer: Taxpayer) {
  db.taxpayers.push(taxpayer)
  db.taxpayerById.set(taxpayer.id, taxpayer)
}

export function addObject(db: Db, object: TaxObject) {
  db.objects.push(object)
  db.objectById.set(object.id, object)
}

export function requireTaxpayer(db: Db, id: string) {
  const taxpayer = db.taxpayerById.get(id)
  if (!taxpayer) throw new Error(`Wajib pajak tidak ditemukan: ${id}`)
  return taxpayer
}

export function requireObject(db: Db, id: string) {
  const object = db.objectById.get(id)
  if (!object) throw new Error(`Objek pajak tidak ditemukan: ${id}`)
  return object
}

export class ApiError extends Error {}

export function fail(message: string): never {
  throw new ApiError(message)
}
