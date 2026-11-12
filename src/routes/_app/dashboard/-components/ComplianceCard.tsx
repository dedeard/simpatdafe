import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DashboardTaxpayerStats, ReportingCompliance } from '@/lib/api/resources'
import { formatDate, formatNumber, formatPercent } from '@/lib/utils'
import { ratio } from '../-utils'

type ComplianceCardProps = { compliance: ReportingCompliance; taxpayers: DashboardTaxpayerStats }

export function ComplianceCard({ compliance, taxpayers }: ComplianceCardProps) {
  const reportedRatio = ratio(compliance.reported, compliance.mustReport)
  const pending = compliance.mustReport - compliance.reported

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kepatuhan pelaporan SPTPD</CardTitle>
        <CardDescription>
          Masa {compliance.period} · batas lapor {formatDate(compliance.dueDate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">{formatPercent(reportedRatio)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(compliance.reported)} / {formatNumber(compliance.mustReport)} WP
            </span>
          </div>
          <Progress value={reportedRatio * 100} aria-label="Kepatuhan pelaporan SPTPD" />
          <span className="text-xs text-muted-foreground">{formatNumber(pending)} WP self-assessment belum lapor</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Wajib pajak per sektor</span>
          <ul className="flex flex-col gap-1.5 text-sm">
            {taxpayers.bySector.map((s) => (
              <li key={s.sector} className="flex items-center justify-between">
                <span>{s.sector}</span>
                <span className="tabular-nums">{formatNumber(s.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
