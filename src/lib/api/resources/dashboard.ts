import { call } from '../rpc'
import type { RevenueCategory } from './reference'

export type { RevenueCategory }

export type RevenueSource = {
  code: string
  name: string
  group: string
  category: RevenueCategory
  target: number
  realized: number
}

export type MonthlyRevenue = { month: string; pajak: number; retribusi: number }
export type DistrictRevenue = { district: string; amount: number }
export type PaymentChannel = { channel: string; label: string; amount: number; transactions: number }

export type Payment = {
  sspd: string
  npwpd: string
  taxpayer: string
  revenue: string
  amount: number
  channel: string
  paidAt: string
}

export type OverdueAssessment = {
  skpd: string
  npwpd: string
  taxpayer: string
  revenue: string
  period: string
  amount: number
  dueDate: string
  daysOverdue: number
}

export type TourismRetribution = {
  domestic: number
  foreign: number
  ratePerVisitor: number
  uptdCount: number
  bludCount: number
}

export type ReportingCompliance = { period: string; mustReport: number; reported: number; dueDate: string }

export type DashboardTaxpayerStats = { active: number; newThisMonth: number; bySector: Array<{ sector: string; count: number }> }

export type DashboardData = {
  fiscalYear: number
  asOf: string
  sources: Array<RevenueSource>
  monthly: Array<MonthlyRevenue>
  districts: Array<DistrictRevenue>
  channels: Array<PaymentChannel>
  recentPayments: Array<Payment>
  overdue: Array<OverdueAssessment>
  overdueCount: number
  overdueAmount: number
  tourism: TourismRetribution
  compliance: ReportingCompliance
  taxpayers: DashboardTaxpayerStats
  lastYearSamePeriod: number
}

export const getDashboard = (): Promise<DashboardData> => call('dashboard.get')
