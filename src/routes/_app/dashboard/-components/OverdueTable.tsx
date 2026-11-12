import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OverdueAssessment } from '@/lib/api/resources'
import { formatDate, formatRupiah } from '@/lib/utils'

const SEVERE_DAYS = 60

export function OverdueTable({ overdue }: { overdue: Array<OverdueAssessment> }) {
  const rows = [...overdue].sort((a, b) => b.daysOverdue - a.daysOverdue)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perlu tindak lanjut penagihan</CardTitle>
        <CardDescription>Ketetapan yang melewati jatuh tempo, terlama di atas</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Wajib pajak</TableHead>
              <TableHead className="pr-6 text-right">Tunggakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.skpd}>
                <TableCell className="pl-6 whitespace-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{o.taxpayer}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.revenue} · {o.period}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium tabular-nums">{formatRupiah(o.amount)}</span>
                    <Badge
                      variant={o.daysOverdue >= SEVERE_DAYS ? 'destructive' : 'secondary'}
                      title={`Jatuh tempo ${formatDate(o.dueDate)}`}
                    >
                      {o.daysOverdue} hari
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
