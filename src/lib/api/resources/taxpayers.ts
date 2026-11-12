import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type TaxpayerStatus = 'draft' | 'verification' | 'active' | 'suspended' | 'closed'
export type TaxpayerType = 'pribadi' | 'badan'

export type Taxpayer = {
  id: string
  npwpd?: string
  type: TaxpayerType
  name: string
  ownerName: string
  nik?: string
  npwp?: string
  phone: string
  email?: string
  address: string
  distrikId: string
  kampungId: string
  status: TaxpayerStatus
  registeredAt: string
  approvedAt?: string
  approvedBy?: string
  rejectionReason?: string
}

export type TaxObject = {
  id: string
  taxpayerId: string
  taxCode: string
  name: string
  category: string
  address: string
  distrikId: string
  kampungId: string
  latitude?: number
  longitude?: number
  capacity?: number
  averageRate?: number
  startedAt: string
  status: 'active' | 'inactive'
  reportingRequired: boolean
}

export type TaxObjectRow = TaxObject & { taxName: string; distrik: string; kampung: string }

export type TaxpayerRow = Taxpayer & { distrik: string; kampung: string; sector: string; objectCount: number }

export type TaxpayerStats = { active: number; verification: number; newThisMonth: number }

export type ObjectInput = {
  taxCode: string
  name: string
  category: string
  capacity?: number
  averageRate?: number
  startedAt: string
  latitude?: number
  longitude?: number
  address?: string
  distrikId?: string
  kampungId?: string
}

export type TaxpayerInput = {
  type: TaxpayerType
  name: string
  ownerName: string
  nik?: string
  npwp?: string
  phone: string
  email?: string
  address: string
  distrikId: string
  kampungId: string
  object: ObjectInput
}

export type TaxpayerPick = { id: string; npwpd: string; name: string; ownerName: string; distrik: string; type: TaxpayerType }

export type TaxpayerDecision = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'close'

export type TaxpayerHistory = {
  sptpd: Array<{ id: string; period: string; taxName: string; taxDue: number; status: string; paid: boolean }>
  assessments: Array<{ id: string; kind: string; taxName: string; total: number; status: string }>
  payments: Array<{ id: string; revenue: string; amount: number; paidAt?: string; status: string }>
  stpd: Array<{ id: string; total: number; status: string }>
}

export const TAXPAYER_STATUS_LABEL: Record<TaxpayerStatus, string> = {
  draft: 'Draf',
  verification: 'Verifikasi',
  active: 'Aktif',
  suspended: 'Non-aktif sementara',
  closed: 'Tutup',
}

export const listTaxpayers = (query: TableQuery): Promise<Page<TaxpayerRow, TaxpayerStats>> => call('taxpayers.list', query)
export const getTaxpayer = (id: string) => call('taxpayers.get', id)
export const createTaxpayer = (input: TaxpayerInput) => call('taxpayers.create', input)
export const updateTaxpayer = (input: Partial<Omit<TaxpayerInput, 'object'>> & { id: string }) => call('taxpayers.update', input)
export const decideTaxpayer = (input: { id: string; action: TaxpayerDecision; reason?: string }) => call('taxpayers.decide', input)
export const addTaxObject = (input: { taxpayerId: string; object: ObjectInput }) => call('taxpayers.addObject', input)
export const searchTaxpayers = (input: { q: string; onlyActive?: boolean }) => call('taxpayers.search', input)
export const getTaxpayerHistory = (id: string) => call('taxpayers.history', id)
