import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { RevenueSource } from '@/lib/api/resources'
import { cn, formatPercent, formatRupiahCompact } from '@/lib/utils'
import { ratio, type DashboardSummary } from '../-utils'

// Expected share of the annual target by mid-November
const ON_TRACK_THRESHOLD = 0.75

export function RevenueBySourceTable({ sources, summary }: { sources: Array<RevenueSource>; summary: DashboardSummary }) {
  const rows = [...sources].sort((a, b) => b.realized - a.realized)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realisasi per jenis pendapatan</CardTitle>
        <CardDescription>
          Pajak (UU HKPD: PBJT, PBB-P2, BPHTB, opsen) dan retribusi daerah. Ditandai bila capaian di bawah{' '}
          {formatPercent(ON_TRACK_THRESHOLD)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Jenis pendapatan</TableHead>
              <TableHead className="hidden text-right md:table-cell">Target</TableHead>
              <TableHead className="text-right">Realisasi</TableHead>
              <TableHead className="w-40 pr-6">Capaian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const achieved = ratio(s.realized, s.target)
              const behind = achieved < ON_TRACK_THRESHOLD
              return (
                <TableRow key={s.name}>
                  <TableCell className="pl-6 whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant={s.category === 'pajak' ? 'secondary' : 'outline'} className="h-4 px-1.5 text-[10px]">
                          {s.category === 'pajak' ? 'Pajak' : 'Retribusi'}
                        </Badge>
                        {s.group}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                    {formatRupiahCompact(s.target)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatRupiahCompact(s.realized)}</TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(achieved, 1) * 100}
                        aria-label={`Capaian ${s.name}`}
                        className={cn('flex-1', behind && '[&_[data-slot=progress-indicator]]:bg-destructive')}
                      />
                      <span className={cn('w-12 text-right text-xs tabular-nums', behind && 'text-destructive')}>
                        {formatPercent(achieved)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-6 font-semibold">Total PAD pajak & retribusi</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{formatRupiahCompact(summary.all.target)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatRupiahCompact(summary.all.realized)}</TableCell>
              <TableCell className="pr-6 text-right tabular-nums">
                {formatPercent(ratio(summary.all.realized, summary.all.target))}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
