import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type SptpdStatus = 'draft' | 'submitted' | 'verified' | 'rejected'

export type SptpdLine = { description: string; quantity: number; unitPrice: number; amount: number }

export type Sptpd = {
  id: string
  taxpayerId: string
  objectId: string
  taxCode: string
  period: string
  lines: Array<SptpdLine>
  grossAmount: number
  rate: number
  taxDue: number
  filedAt: string
  filedBy: 'wp' | 'operator'
  dueDate: string
  status: SptpdStatus
  rejectionReason?: string
  verifiedAt?: string
  attachments: Array<string>
  note?: string
  sspdId?: string
  paidAt?: string
}

export type SptpdRow = Sptpd & {
  npwpd: string
  taxpayerName: string
  objectName: string
  taxName: string
  distrik: string
}

export type SptpdStats = { period: string; mustReport: number; reported: number; totalTax: number }

export type MissingRow = {
  objectId: string
  taxpayerId: string
  npwpd: string
  taxpayerName: string
  objectName: string
  taxCode: string
  taxName: string
  distrik: string
}

export type SptpdInput = {
  taxpayerId: string
  objectId: string
  period: string
  lines: Array<{ description: string; quantity: number; unitPrice: number }>
  attachments: Array<string>
  note?: string
  submit: boolean
}

export const SPTPD_STATUS_LABEL: Record<SptpdStatus, string> = {
  draft: 'Draf',
  submitted: 'Dilaporkan',
  verified: 'Diverifikasi',
  rejected: 'Ditolak',
}

export const SPTPD_LINE_PRESETS: Record<string, Array<string>> = {
  '4.1.01.12': ['Sewa kamar', 'Paket diving', 'Laundry'],
  '4.1.01.11': ['Penjualan makanan', 'Penjualan minuman'],
  '4.1.01.15': ['Tiket hiburan', 'Sewa peralatan'],
  '4.1.01.14': ['Retribusi parkir roda dua', 'Retribusi parkir roda empat'],
  '4.1.01.13': ['Pemakaian listrik (kWh)'],
  '4.1.01.20': ['Pasir', 'Batu kali', 'Kerikil'],
  '4.1.01.18': ['Penjualan sarang walet (kg)'],
}

export const listSptpd = (query: TableQuery): Promise<Page<SptpdRow, SptpdStats>> => call('sptpd.list', query)
export const listMissingSptpd = (query: TableQuery): Promise<Page<MissingRow>> => call('sptpd.missing', query)
export const getSptpd = (id: string) => call('sptpd.get', id)
export const createSptpd = (input: SptpdInput) => call('sptpd.create', input)
export const decideSptpd = (input: { id: string; action: 'submit' | 'verify' | 'reject'; reason?: string }) => call('sptpd.decide', input)
export const listVerifiedSptpd = (taxpayerId: string) => call('sptpd.forTaxpayer', taxpayerId)
