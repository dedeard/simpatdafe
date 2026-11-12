import { call } from '../rpc'
import type { BillKind, BillRef, Page, TableQuery } from './common'

export type Channel = 'teller' | 'va' | 'qris' | 'bendahara'
export type SspdStatus = 'pending' | 'paid' | 'expired' | 'void'

export type Sspd = {
  id: string
  paymentCode: string
  bill: BillRef
  taxpayerId?: string
  payerName: string
  revenueCode: string
  description: string
  amount: number
  channel?: Channel
  bankRef?: string
  createdAt: string
  expiresAt: string
  paidAt?: string
  status: Exclude<SspdStatus, 'expired'>
  reconciled: boolean
  voidReason?: string
}

export type SspdRow = Omit<Sspd, 'status'> & { status: SspdStatus; revenueName: string; npwpd?: string }

export type PaymentStats = { received: number; count: number; pendingCount: number; pendingAmount: number }

export type BillOption = {
  ref: BillRef
  label: string
  payerName: string
  amount: number
  revenueCode: string
}

export type BankStatementRow = { bankRef: string; paymentCode: string; amount: number; time: string; matchedSspdId?: string }

export type Reconciliation = {
  date: string
  bank: Array<BankStatementRow>
  sspd: Array<SspdRow & { matched: boolean }>
  bankTotal: number
  sspdTotal: number
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  teller: 'Teller Bank Papua',
  va: 'Virtual Account',
  qris: 'QRIS',
  bendahara: 'Bendahara Penerima',
}

export const SSPD_STATUS_LABEL: Record<SspdStatus, string> = {
  pending: 'Menunggu bayar',
  paid: 'Lunas',
  expired: 'Kedaluwarsa',
  void: 'Dibatalkan',
}

export const BILL_KIND_LABEL: Record<BillKind, string> = {
  sptpd: 'SPTPD',
  skpd: 'SKPD / SKPDKB',
  stpd: 'STPD',
  skrd: 'SKRD',
  sppt: 'SPPT PBB-P2',
  bphtb: 'BPHTB',
  port: 'Retribusi pelabuhan',
  ticket: 'Tiket wisata',
  opsen: 'Opsen (transfer provinsi)',
}

export const PAYABLE_KINDS: Array<BillKind> = ['sptpd', 'skpd', 'stpd', 'skrd', 'sppt', 'bphtb', 'port']

export const listPayments = (query: TableQuery): Promise<Page<SspdRow, PaymentStats>> => call('payments.list', query)
export const getPayment = (id: string) => call('payments.get', id)
export const listBills = (input: { kind: BillKind; q?: string }) => call('payments.billsFor', input)
export const createPaymentCode = (bill: BillRef) => call('payments.createCode', bill)
export const recordPayment = (input: { id: string; channel: Channel; paidAt: string; bankRef: string; amount: number }) =>
  call('payments.record', input)
export const voidPayment = (input: { id: string; reason: string }) => call('payments.void', input)
export const getReconciliation = (date: string): Promise<Reconciliation> => call('payments.reconciliation', date)
export const markReconciled = (id: string) => call('payments.markReconciled', id)
