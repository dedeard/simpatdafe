import { Badge } from '@/components/ui/badge'
import { getDashboard } from '@/lib/api/resources'
import { formatDate } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import {
  ComplianceCard,
  DistrictRevenueChart,
  KpiCards,
  MonthlyRevenueChart,
  OverdueTable,
  PaymentChannelChart,
  RecentPaymentsTable,
  RevenueBySourceTable,
  TourismRetributionCard,
} from './-components'
import { summarize } from './-utils'

export const Route = createFileRoute('/app/dashboard/')({
  head: () => ({ meta: [{ title: 'Beranda | SIMPATDA Raja Ampat' }] }),
  loader: () => getDashboard(),
  component: DashboardPage,
})

function DashboardPage() {
  const data = Route.useLoaderData()
  const summary = summarize(data)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Beranda</h1>
          <p className="text-sm text-muted-foreground">Ringkasan pendapatan asli daerah dari pajak dan retribusi Kabupaten Raja Ampat</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">TA {data.fiscalYear}</Badge>
          Data per {formatDate(data.asOf, { dateStyle: 'long', timeStyle: 'short' })} WIT
        </div>
      </div>

      <KpiCards data={data} summary={summary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MonthlyRevenueChart data={data.monthly} fiscalYear={data.fiscalYear} />
        <PaymentChannelChart channels={data.channels} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueBySourceTable sources={data.sources} summary={summary} />
        <div className="flex flex-col gap-4">
          <TourismRetributionCard tourism={data.tourism} />
          <ComplianceCard compliance={data.compliance} taxpayers={data.taxpayers} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentPaymentsTable payments={data.recentPayments} />
        <OverdueTable overdue={data.overdue} />
      </div>

      <DistrictRevenueChart districts={data.districts} />
    </div>
  )
}
