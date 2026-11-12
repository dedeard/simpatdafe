import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Payment } from '@/lib/api/resources'
import { formatDateTime, formatRupiah } from '@/lib/utils'

export function RecentPaymentsTable({ payments }: { payments: Array<Payment> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pembayaran terbaru</CardTitle>
        <CardDescription>SSPD dan tiket retribusi yang sudah tervalidasi bank</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Wajib pajak</TableHead>
              <TableHead className="hidden md:table-cell">Jenis</TableHead>
              <TableHead className="hidden sm:table-cell">Kanal</TableHead>
              <TableHead className="pr-6 text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.sspd}>
                <TableCell className="pl-6 whitespace-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{p.taxpayer}</span>
                    <span className="font-mono text-xs text-muted-foreground">{p.sspd}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">{p.revenue}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{p.channel}</Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium tabular-nums">{formatRupiah(p.amount)}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)}</span>
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
