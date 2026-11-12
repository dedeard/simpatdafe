import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getPiutangReport } from '@/lib/api/resources'
import { formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ReportSheet } from '../-components/ReportSheet'
import { downloadCsv } from '../-utils'
import { PageHeader, StatCard, StatGrid } from '../../-components'

export const Route = createFileRoute('/_app/laporan/piutang/')({
  head: () => ({ meta: [{ title: 'Laporan piutang | SIMPATDA Raja Ampat' }] }),
  loader: () => getPiutangReport(),
  component: ReceivablesPage,
})

const config = {
  b0: { label: '1–30 hari', color: 'var(--chart-4)' },
  b1: { label: '31–90 hari', color: 'var(--chart-3)' },
  b2: { label: '91–180 hari', color: 'var(--chart-5)' },
  b3: { label: '> 180 hari', color: 'var(--chart-2)' },
} satisfies ChartConfig

function ReceivablesPage() {
  const r = Route.useLoaderData()
  const total = r.buckets.reduce((s, b) => s + b.amount, 0)
  const count = r.buckets.reduce((s, b) => s + b.count, 0)
  const chart = r.byTax.slice(0, 8).map((t) => ({
    name: t.name.replace('PBJT ', '').replace('Pajak ', ''),
    b0: t.buckets[0],
    b1: t.buckets[1],
    b2: t.buckets[2],
    b3: t.buckets[3],
  }))

  const csv = () =>
    downloadCsv('piutang.csv', [
      ['Jenis pendapatan', '1-30 hari', '31-90 hari', '91-180 hari', '>180 hari', 'Total'],
      ...r.byTax.map((t) => [t.name, ...t.buckets, t.total]),
    ])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader title="Piutang" description="Tagihan yang sudah jatuh tempo dan belum dibayar, dikelompokkan menurut umur tunggakan." />
      <StatGrid className="print:hidden">
        <StatCard label="Total piutang" value={formatRupiahCompact(total)} tone="danger" />
        <StatCard label="Jumlah dokumen" value={formatNumber(count)} />
        {r.buckets.slice(2).map((b) => (
          <StatCard key={b.bucket} label={b.bucket} value={formatRupiahCompact(b.amount)} hint={`${formatNumber(b.count)} dokumen`} />
        ))}
      </StatGrid>
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Piutang menurut jenis dan umur</CardTitle>
          <CardDescription>Delapan jenis pendapatan terbesar</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="aspect-auto h-72 w-full">
            <BarChart data={chart} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatRupiahCompact(v)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {(['b0', 'b1', 'b2', 'b3'] as const).map((k, i) => (
                <Bar
                  key={k}
                  isAnimationActive={false}
                  dataKey={k}
                  stackId="age"
                  fill={`var(--color-${k})`}
                  radius={i === 3 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <ReportSheet
        title="Laporan piutang pajak dan retribusi daerah"
        period={`Per ${formatDate(r.asOf, { dateStyle: 'long' })}`}
        onCsv={csv}
      >
        <div className="overflow-x-auto">
          <Table className="print:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Jenis pendapatan</TableHead>
                {r.buckets.map((b) => (
                  <TableHead key={b.bucket} className="text-right">
                    {b.bucket}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.byTax.map((t) => (
                <TableRow key={t.name}>
                  <TableCell>{t.name}</TableCell>
                  {t.buckets.map((v, i) => (
                    <TableCell key={i} className="text-right tabular-nums">
                      {v ? formatRupiah(v) : '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium tabular-nums">{formatRupiah(t.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                {r.buckets.map((b) => (
                  <TableCell key={b.bucket} className="text-right font-semibold tabular-nums">
                    {formatRupiah(b.amount)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold tabular-nums">{formatRupiah(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Menurut distrik</h3>
            <Table className="print:text-xs">
              <TableBody>
                {r.byDistrik.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(d.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">25 tunggakan terbesar</h3>
            <Table className="print:text-xs">
              <TableBody>
                {r.rows.map((x) => (
                  <TableRow key={x.label}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{x.payer}</span>
                        <span className="text-xs text-muted-foreground">
                          {x.revenue} · {x.daysLate} hari
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(x.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ReportSheet>
    </div>
  )
}
