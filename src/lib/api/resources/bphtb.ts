import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type BphtbType = 'jual_beli' | 'hibah' | 'waris' | 'tukar_menukar' | 'pemberian_hak_baru' | 'lelang'
export type BphtbStatus = 'submitted' | 'verified' | 'paid' | 'validated' | 'rejected'

export type BphtbFiling = {
  id: string
  nop: string
  transactionType: BphtbType
  buyer: { name: string; nik: string; address: string }
  seller: { name: string; nik?: string }
  ppat?: string
  landArea: number
  buildingArea: number
  declaredPrice: number
  njop: number
  npop: number
  npoptkp: number
  npopkp: number
  rate: number
  amount: number
  status: BphtbStatus
  verificationNote?: string
  attachments: Array<string>
  sspdId?: string
  submittedAt: string
  paidAt?: string
  validatedAt?: string
}

export type BphtbRow = BphtbFiling & { location: string; belowNjop: boolean }
export type BphtbStats = { total: number; pending: number; amount: number }

export type BphtbInput = {
  nop: string
  transactionType: BphtbType
  buyer: { name: string; nik: string; address: string }
  seller: { name: string; nik?: string }
  ppat?: string
  declaredPrice: number
  attachments: Array<string>
}

export const PPAT_LIST = [
  'PPAT Yohanes Mayor, S.H.',
  'PPAT Siti Maryam Wanma, S.H., M.Kn.',
  'PPAT Hendrik Rumbiak, S.H.',
  'PPAT Agus Santoso, S.H., M.Kn.',
  'PPAT Rina Dimara, S.H.',
] as const

export const BPHTB_TYPE_LABEL: Record<BphtbType, string> = {
  jual_beli: 'Jual beli',
  hibah: 'Hibah',
  waris: 'Waris',
  tukar_menukar: 'Tukar menukar',
  pemberian_hak_baru: 'Pemberian hak baru',
  lelang: 'Lelang',
}

export const BPHTB_STATUS_LABEL: Record<BphtbStatus, string> = {
  submitted: 'Diajukan',
  verified: 'Diverifikasi',
  paid: 'Dibayar',
  validated: 'Tervalidasi',
  rejected: 'Ditolak',
}

export const REQUIRED_ATTACHMENTS = ['Akta jual beli / dasar peralihan', 'KTP pembeli', 'SPPT PBB terakhir'] as const

export const listBphtb = (query: TableQuery): Promise<Page<BphtbRow, BphtbStats>> => call('bphtb.list', query)
export const getBphtb = (id: string) => call('bphtb.get', id)
export const createBphtb = (input: BphtbInput) => call('bphtb.create', input)
export const decideBphtb = (input: { id: string; action: 'verify' | 'reject' | 'validate'; note?: string; adjustedNpop?: number }) =>
  call('bphtb.decide', input)
export const lookupNop = (q: string) => call('bphtb.lookupNop', q)
