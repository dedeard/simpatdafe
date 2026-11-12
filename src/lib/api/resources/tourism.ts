import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type EntryCategory = 'mancanegara' | 'domestik' | 'lokal'
export type SellingPoint = 'pelabuhan_waisai' | 'bandara_marinda' | 'loket_online' | 'pos_misool'

export type Visitor = { name: string; nationality: string; category: EntryCategory; idNumber: string }

export type EntryTicket = {
  id: string
  point: SellingPoint
  visitors: Array<Visitor>
  total: number
  validFrom: string
  validUntil: string
  channel: 'qris' | 'tunai' | 'va'
  sspdId: string
  soldAt: string
  officer: string
}

export type TicketRow = {
  id: string
  leader: string
  count: number
  mix: Record<EntryCategory, number>
  total: number
  channel: EntryTicket['channel']
  point: SellingPoint
  soldAt: string
}

export type TicketStats = { tickets: number; visitors: number; amount: number; mix: Record<EntryCategory, number> }

export type ReconciliationRow = {
  date: string
  uptd: number
  blud: number
  gap: number
  gapPct: number
  potential: number
  checkedNote?: string
}

export type TicketInput = {
  point: SellingPoint
  channel: EntryTicket['channel']
  visitors: Array<Visitor>
}

export const POINT_LABEL: Record<SellingPoint, string> = {
  pelabuhan_waisai: 'Pelabuhan Waisai',
  bandara_marinda: 'Bandara Marinda',
  loket_online: 'Loket online',
  pos_misool: 'Pos Misool',
}

export const CATEGORY_LABEL: Record<EntryCategory, string> = {
  mancanegara: 'Mancanegara',
  domestik: 'Domestik',
  lokal: 'Lokal Papua',
}

export const NATIONALITIES: Array<{ code: string; name: string; category: EntryCategory }> = [
  { code: 'ID', name: 'Indonesia', category: 'domestik' },
  { code: 'AU', name: 'Australia', category: 'mancanegara' },
  { code: 'US', name: 'Amerika Serikat', category: 'mancanegara' },
  { code: 'DE', name: 'Jerman', category: 'mancanegara' },
  { code: 'FR', name: 'Prancis', category: 'mancanegara' },
  { code: 'GB', name: 'Inggris', category: 'mancanegara' },
  { code: 'NL', name: 'Belanda', category: 'mancanegara' },
  { code: 'CN', name: 'Tiongkok', category: 'mancanegara' },
  { code: 'IT', name: 'Italia', category: 'mancanegara' },
  { code: 'ES', name: 'Spanyol', category: 'mancanegara' },
  { code: 'CH', name: 'Swiss', category: 'mancanegara' },
  { code: 'JP', name: 'Jepang', category: 'mancanegara' },
  { code: 'SG', name: 'Singapura', category: 'mancanegara' },
]

export const listTickets = (query: TableQuery): Promise<Page<TicketRow, TicketStats>> => call('tourism.list', query)
export const getTicket = (id: string) => call('tourism.get', id)
export const createTicket = (input: TicketInput) => call('tourism.create', input)
export const getTourismReconciliation = (input: { from: string; to: string }) => call('tourism.reconciliation', input)
export const markTourismChecked = (input: { date: string; note: string }) => call('tourism.markChecked', input)
