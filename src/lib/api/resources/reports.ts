import { call } from '../rpc'
import type { Channel, SspdRow } from './payments'
import type { RevenueCategory } from './reference'

export type RealisasiRow = {
  code: string
  name: string
  group: string
  category: RevenueCategory
  target: number
  previous: number
  current: number
  cumulative: number
}

export type Realisasi = { year: number; month: number; rows: Array<RealisasiRow>; thisYearLabel: string }

export type DailyReport = { date: string; rows: Array<SspdRow>; total: number; byChannel: Record<Channel, number> }

export type PerWpRow = {
  taxpayerId: string
  npwpd: string
  name: string
  distrik: string
  paid: number
  monthsReported: number
  monthsDue: number
  arrears: number
}

export type PiutangReport = {
  asOf: string
  buckets: Array<{ bucket: string; count: number; amount: number }>
  byTax: Array<{ name: string; buckets: Array<number>; total: number }>
  byDistrik: Array<{ name: string; amount: number }>
  rows: Array<{ label: string; payer: string; revenue: string; amount: number; daysLate: number }>
}

export const getRealisasi = (input: { year: number; month: number }): Promise<Realisasi> => call('reports.realisasi', input)
export const getDailyReport = (input: { date: string; channel?: string }): Promise<DailyReport> => call('reports.daily', input)
export const getPerWpReport = (input: { year: number; taxCode?: string; distrikId?: string }): Promise<Array<PerWpRow>> =>
  call('reports.perWp', input)
export const getPiutangReport = (): Promise<PiutangReport> => call('reports.piutang')
