import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTourismReconciliation, markTourismChecked, type ReconciliationRow } from '@/lib/api/resources'
import { formatDate, formatNumber, formatPercent, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { ConfirmDialog, DateField, PageHeader, StatCard, StatGrid } from '../../../-components'

export const Route = createFileRoute('/_app/retribusi/tanda-masuk/rekonsiliasi/')({
  head: () => ({ meta: [{ title: 'Rekonsiliasi kunjungan | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === 'string' ? search.from : '2026-10-01',
    to: typeof search.to === 'string' ? search.to : '2026-11-12',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => ({ range: deps, rows: await getTourismReconciliation(deps) }),
  component: ReconciliationPage,
})

const config = {
  uptd: { label: 'UPTD kabupaten', color: 'var(--chart-1)' },
  blud: { label: 'BLUD KKP provinsi', color: 'var(--chart-2)' },
} satisfies ChartConfig

const GAP_FLAG = 0.1

function ReconciliationPage() {
  const { range, rows } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [checking, setChecking] = useState<ReconciliationRow | null>(null)

  const totals = rows.reduce((a, r) => ({ uptd: a.uptd + r.uptd, blud: a.blud + r.blud, potential: a.potential + r.potential }), {
    uptd: 0,
    blud: 0,
    potential: 0,
  })
  const flagged = rows.filter((r) => r.gapPct > GAP_FLAG && !r.checkedNote)
  const setRange = (patch: Partial<typeof range>) => navigate({ to: '.', search: { ...range, ...patch } })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Rekonsiliasi kunjungan wisata"
        description="Bandingkan jumlah wisatawan yang tercatat UPTD Dinas Pariwisata dengan BLUD pengelola kawasan konservasi perairan. Selisih dapat berarti kebocoran penerimaan."
        back={{ to: '/retribusi/tanda-masuk', label: 'Daftar tiket' }}
      />
      <div className="flex flex-wrap items-end gap-3">
        <DateField label="Dari" value={range.from} max={range.to} onChange={(from) => from && setRange({ from })} className="w-44" />
        <DateField
          label="Sampai"
          value={range.to}
          min={range.from}
          max="2026-11-12"
          onChange={(to) => to && setRange({ to })}
          className="w-44"
        />
      </div>
      <StatGrid>
        <StatCard label="UPTD kabupaten" value={formatNumber(totals.uptd)} />
        <StatCard label="BLUD KKP provinsi" value={formatNumber(totals.blud)} />
        <StatCard
          label="Selisih"
          value={`${formatNumber(totals.uptd - totals.blud)} (${formatPercent(totals.uptd ? (totals.uptd - totals.blud) / totals.uptd : 0)})`}
          tone="warning"
        />
        <StatCard
          label="Potensi retribusi hilang"
          value={formatRupiahCompact(totals.potential)}
          hint={`${flagged.length} hari selisih > ${formatPercent(GAP_FLAG)} belum dicek`}
          tone="danger"
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Kunjungan harian</CardTitle>
          <CardDescription>Jumlah wisatawan per hari menurut dua sumber data.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <LineChart data={rows.map((r) => ({ ...r, label: r.date.slice(5) }))} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line isAnimationActive={false} dataKey="uptd" type="monotone" stroke="var(--color-uptd)" strokeWidth={2} dot={false} />
              <Line isAnimationActive={false} dataKey="blud" type="monotone" stroke="var(--color-blud)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="max-h-[36rem] overflow-y-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tanggal</TableHead>
                <TableHead className="text-right">UPTD</TableHead>
                <TableHead className="text-right">BLUD</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead className="hidden text-right sm:table-cell">%</TableHead>
                <TableHead className="hidden text-right md:table-cell">Potensi</TableHead>
                <TableHead className="pr-6 text-right">Pengecekan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().map((r) => (
                <TableRow key={r.date} className={r.gapPct > GAP_FLAG && !r.checkedNote ? 'bg-chart-3/10' : undefined}>
                  <TableCell className="pl-6">{formatDate(r.date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.uptd)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.blud)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.gap)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatPercent(r.gapPct)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{formatRupiah(r.potential)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    {r.checkedNote ? (
                      <Badge variant="secondary" title={r.checkedNote}>
                        Sudah dicek
                      </Badge>
                    ) : r.gapPct > GAP_FLAG ? (
                      <Button size="sm" variant="outline" onClick={() => setChecking(r)}>
                        Tandai dicek
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-6 font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totals.uptd)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totals.blud)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totals.uptd - totals.blud)}</TableCell>
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="hidden text-right font-semibold tabular-nums md:table-cell">
                  {formatRupiah(totals.potential)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {checking && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setChecking(null)}
          title={`Tandai ${formatDate(checking.date)} sudah dicek`}
          description={`Selisih ${formatNumber(checking.gap)} wisatawan (${formatPercent(checking.gapPct)}). Tulis hasil pengecekan ke petugas pos.`}
          confirmLabel="Simpan pengecekan"
          askReason="Catatan pengecekan"
          onConfirm={async (reason) => {
            await markTourismChecked({ date: checking.date, note: reason })
            toast.success('Pengecekan dicatat.')
            await router.invalidate()
          }}
        />
      )}
    </div>
  )
}
