import type { DashboardData } from '@/lib/api/resources'
import type { WidgetId } from '@/lib/dashboard-widgets'
import type { DashboardSummary } from '../-utils'
import { ComplianceCard } from './ComplianceCard'
import { DistrictRevenueChart } from './DistrictRevenueChart'
import { MonthKpi, OverdueKpi, RealizationKpi, TaxpayersKpi } from './KpiCards'
import { MonthlyRevenueChart } from './MonthlyRevenueChart'
import { OverdueTable } from './OverdueTable'
import { PaymentChannelChart } from './PaymentChannelChart'
import { RecentPaymentsTable } from './RecentPaymentsTable'
import { RevenueBySourceTable } from './RevenueBySourceTable'
import { TourismRetributionCard } from './TourismRetributionCard'

export type WidgetContext = { data: DashboardData; summary: DashboardSummary }

export const WIDGET_RENDERERS: Record<WidgetId, (ctx: WidgetContext) => React.ReactNode> = {
  'kpi-realization': (ctx) => <RealizationKpi {...ctx} />,
  'kpi-month': (ctx) => <MonthKpi {...ctx} />,
  'kpi-taxpayers': (ctx) => <TaxpayersKpi {...ctx} />,
  'kpi-overdue': (ctx) => <OverdueKpi {...ctx} />,
  'monthly-revenue': ({ data }) => <MonthlyRevenueChart data={data.monthly} fiscalYear={data.fiscalYear} />,
  'payment-channels': ({ data }) => <PaymentChannelChart channels={data.channels} />,
  'revenue-sources': ({ data, summary }) => <RevenueBySourceTable sources={data.sources} summary={summary} />,
  tourism: ({ data }) => <TourismRetributionCard tourism={data.tourism} />,
  compliance: ({ data }) => <ComplianceCard compliance={data.compliance} taxpayers={data.taxpayers} />,
  'recent-payments': ({ data }) => <RecentPaymentsTable payments={data.recentPayments} />,
  overdue: ({ data }) => <OverdueTable overdue={data.overdue} />,
  districts: ({ data }) => <DistrictRevenueChart districts={data.districts} />,
}
