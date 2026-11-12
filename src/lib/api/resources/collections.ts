import { call } from '../rpc'
import type { BillRef, Page, TableQuery } from './common'

export type StpdStatus = 'issued' | 'reminded' | 'forced' | 'paid'
export type ActionType = 'teguran' | 'surat_paksa' | 'kunjungan' | 'telepon' | 'janji_bayar'

export type CollectionAction = { type: ActionType; date: string; officer: string; note: string; promiseDate?: string }

export type Stpd = {
  id: string
  taxpayerId?: string
  source: BillRef
  payerName: string
  revenueCode: string
  principal: number
  months: number
  interest: number
  total: number
  issuedAt: string
  dueDate: string
  status: StpdStatus
  actions: Array<CollectionAction>
  sspdId?: string
  paidAt?: string
  note?: string
}

export type StpdRow = Stpd & { revenueName: string; npwpd?: string; distrik: string }

export type OverdueRow = {
  ref: BillRef
  label: string
  taxpayerId?: string
  npwpd?: string
  payerName: string
  revenueCode: string
  revenueName: string
  principal: number
  dueDate: string
  daysLate: number
  monthsLate: number
  interest: number
  total: number
  stage: 'belum' | StpdStatus
  stpdId?: string
  distrik: string
}

export type AgingBucket = { bucket: string; count: number; amount: number }

export type StpdPreview = {
  label: string
  payerName: string
  principal: number
  months: number
  interest: number
  total: number
  dueDate: string
  sourceDueDate: string
}

export const STPD_STATUS_LABEL: Record<StpdStatus, string> = {
  issued: 'Terbit',
  reminded: 'Teguran',
  forced: 'Surat paksa',
  paid: 'Lunas',
}

export const ACTION_LABEL: Record<ActionType, string> = {
  teguran: 'Teguran',
  surat_paksa: 'Surat paksa',
  kunjungan: 'Kunjungan lapangan',
  telepon: 'Telepon',
  janji_bayar: 'Janji bayar',
}

export const AGING_BUCKETS = ['1–30 hari', '31–90 hari', '91–180 hari', '> 180 hari'] as const

export const listWorklist = (query: TableQuery): Promise<Page<OverdueRow, { buckets: Array<AgingBucket> }>> =>
  call('collections.worklist', query)
export const listStpd = (query: TableQuery): Promise<Page<StpdRow>> => call('stpd.list', query)
export const getStpd = (id: string) => call('stpd.get', id)
export const previewStpd = (source: BillRef): Promise<StpdPreview> => call('stpd.preview', source)
export const createStpd = (input: { source: BillRef; issuedAt: string; note?: string }) => call('stpd.create', input)
export const addCollectionAction = (input: { id: string; action: CollectionAction }) => call('stpd.addAction', input)
export const advanceStpd = (input: { id: string; to: 'reminded' | 'forced' }) => call('stpd.advance', input)
