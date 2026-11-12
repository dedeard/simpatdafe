import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DashboardData } from '@/lib/api/resources'
import { formatNumber, formatPercent, formatRupiahCompact } from '@/lib/utils'
import { AlertTriangleIcon, TrendingUpIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { ratio, type DashboardSummary } from '../-utils'

type KpiCardsProps = { data: DashboardData; summary: DashboardSummary }

export function KpiCards({ data, summary }: KpiCardsProps) {
  const achievement = ratio(summary.all.realized, summary.all.target)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Realisasi PAD (pajak + retribusi)</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatRupiahCompact(summary.all.realized)}</CardTitle>
          <CardAction>
            <Badge variant="secondary">{formatPercent(achievement)}</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2">
          <Progress value={achievement * 100} aria-label="Capaian target PAD" />
          <span className="text-xs text-muted-foreground">
            Target TA {data.fiscalYear}: {formatRupiahCompact(summary.all.target)}
          </span>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Penerimaan {summary.thisMonthLabel} (berjalan)</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatRupiahCompact(summary.thisMonth)}</CardTitle>
          <CardAction>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="gap-1.5 text-xs text-muted-foreground">
          <TrendingUpIcon className="size-3.5 text-chart-4" />
          {formatPercent(summary.yoyGrowth)} dibanding periode yang sama {data.fiscalYear - 1}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Wajib pajak aktif (NPWPD)</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatNumber(data.taxpayers.active)}</CardTitle>
          <CardAction>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardFooter className="text-xs text-muted-foreground">
          +{formatNumber(data.taxpayers.newThisMonth)} pendaftaran baru bulan ini
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Piutang jatuh tempo</CardDescription>
          <CardTitle className="text-2xl text-destructive tabular-nums">{formatRupiahCompact(summary.overdueTotal)}</CardTitle>
          <CardAction>
            <AlertTriangleIcon className="size-4 text-destructive" />
          </CardAction>
        </CardHeader>
        <CardFooter className="text-xs text-muted-foreground">
          {formatNumber(data.overdue.length)} ketetapan (SKPD/STPD/SPPT) belum dibayar
        </CardFooter>
      </Card>
    </div>
  )
}
