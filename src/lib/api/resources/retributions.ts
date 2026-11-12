import { call } from '../rpc'
import type { Page, TableQuery } from './common'

export type SkrdStatus = 'issued' | 'paid' | 'overdue' | 'cancelled'

export type SkrdLine = { description: string; quantity: number; unit: string; unitPrice: number; amount: number }

export type Skrd = {
  id: string
  retributionCode: string
  taxpayerId?: string
  payerName: string
  payerAddress: string
  period: string
  lines: Array<SkrdLine>
  total: number
  issuedAt: string
  dueDate: string
  status: Exclude<SkrdStatus, 'overdue'>
  sspdId?: string
  paidAt?: string
  cancelReason?: string
}

export type SkrdRow = Omit<Skrd, 'status'> & { status: SkrdStatus; retributionName: string; npwpd?: string }

export type SkrdStats = { issued: number; total: number; overdue: number }

export type SkrdInput = {
  retributionCode: string
  taxpayerId?: string
  payerName: string
  payerAddress: string
  period: string
  dueDate: string
  lines: Array<{ description: string; quantity: number; unit: string; unitPrice: number }>
}

export type WasteRunPreview = { period: string; subscribers: number; alreadyIssued: number; toIssue: number; total: number }

export const SKRD_STATUS_LABEL: Record<SkrdStatus, string> = {
  issued: 'Terbit',
  paid: 'Lunas',
  overdue: 'Jatuh tempo',
  cancelled: 'Batal',
}

export const SKRD_CODES = ['4.1.02.01', '4.1.02.03', '4.1.02.05'] as const

export const listSkrd = (query: TableQuery): Promise<Page<SkrdRow, SkrdStats>> => call('skrd.list', query)
export const getSkrd = (id: string) => call('skrd.get', id)
export const createSkrd = (input: SkrdInput) => call('skrd.create', input)
export const cancelSkrd = (input: { id: string; reason: string }) => call('skrd.cancel', input)
export const previewWasteRun = (period: string): Promise<WasteRunPreview> => call('skrd.wastePreview', period)
export const issueWasteRun = (period: string) => call('skrd.wasteIssue', period)
