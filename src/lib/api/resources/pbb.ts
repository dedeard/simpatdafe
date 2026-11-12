import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type PbbUse = 'perumahan' | 'usaha' | 'kantor' | 'pariwisata' | 'tanah_kosong' | 'kebun'

export type PbbObject = {
  nop: string
  ownerName: string
  ownerNik?: string
  ownerAddress: string
  objectAddress: string
  distrikId: string
  kampungId: string
  landArea: number
  buildingArea: number
  landClass: string
  buildingClass: string
  landValuePerM2: number
  buildingValuePerM2: number
  njop: number
  use: PbbUse
  ownershipHistory: Array<{ owner: string; from: string; source: string }>
}

export type Sppt = {
  nop: string
  year: number
  njop: number
  njoptkp: number
  njkp: number
  rate: number
  amount: number
  dueDate: string
  status: 'issued' | 'paid'
  sspdId?: string
  paidAt?: string
}

export type SpptRow = Omit<Sppt, 'status'> & { status: 'issued' | 'paid' | 'overdue'; ownerName: string; location: string }

export type PbbObjectRow = PbbObject & { distrik: string; kampung: string; currentSppt?: SpptRow }

export type PbbStats = { objects: number; njop: number; issuedAmount: number; paidAmount: number }

export type PbbObjectInput = {
  ownerName: string
  ownerNik: string
  ownerAddress: string
  objectAddress: string
  distrikId: string
  kampungId: string
  landArea: number
  buildingArea: number
  landClass: string
  buildingClass: string
  use: PbbUse
}

export type MassIssuePreview = {
  year: number
  alreadyIssued: boolean
  objects: number
  totalNjop: number
  totalAmount: number
  belowMinimum: number
}

export const USE_LABEL: Record<PbbUse, string> = {
  perumahan: 'Perumahan',
  usaha: 'Usaha',
  kantor: 'Kantor',
  pariwisata: 'Pariwisata',
  tanah_kosong: 'Tanah kosong',
  kebun: 'Kebun',
}

export const LAND_CLASSES = [
  { value: 'A1', label: 'A1 · Pusat Waisai', perM2: 850_000 },
  { value: 'A2', label: 'A2 · Waisai pinggiran', perM2: 520_000 },
  { value: 'B1', label: 'B1 · Ibu kota distrik', perM2: 250_000 },
  { value: 'B2', label: 'B2 · Kampung pesisir', perM2: 140_000 },
  { value: 'C1', label: 'C1 · Kampung pulau', perM2: 80_000 },
  { value: 'C2', label: 'C2 · Lahan terpencil', perM2: 35_000 },
] as const

export const BUILDING_CLASSES = [
  { value: 'S1', label: 'S1 · Permanen mewah', perM2: 4_500_000 },
  { value: 'S2', label: 'S2 · Permanen menengah', perM2: 2_800_000 },
  { value: 'S3', label: 'S3 · Semi permanen', perM2: 1_200_000 },
  { value: 'S4', label: 'S4 · Panggung kayu', perM2: 900_000 },
] as const

export const listPbbObjects = (query: TableQuery): Promise<Page<PbbObjectRow, PbbStats>> => call('pbb.objects', query)
export const getPbbObject = (nop: string) => call('pbb.object', nop)
export const createPbbObject = (input: PbbObjectInput) => call('pbb.createObject', input)
export const listSppt = (query: TableQuery): Promise<Page<SpptRow, PbbStats>> => call('pbb.sppt', query)
export const previewMassIssue = (year: number): Promise<MassIssuePreview> => call('pbb.massPreview', year)
export const massIssueSppt = (year: number) => call('pbb.massIssue', year)
