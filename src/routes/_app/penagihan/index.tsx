import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DISTRIK, REVENUE_LINES, listWorklist, type OverdueRow } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { cn, formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Can, DataTable, PageHeader, STPD_STATUS_MAP, StatusBadge, type Column } from '../-components'
import { useAppData, useTableParams } from '../-hooks'
import { parseTableSearch } from '../-utils'

export const Route = createFileRoute('/_app/penagihan/')({
  head: () => ({ meta: [{ title: 'Penagihan | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listWorklist(deps),
  component: CollectionsPage,
})

const columns: Array<Column<OverdueRow>> = [
  {
    header: 'Tunggakan',
    cell: (r) => (
      <div className="flex flex-col">
        <span className="font-medium">{r.payerName}</span>
        <span className="font-mono text-xs text-muted-foreground">{r.label}</span>
      </div>
    ),
  },
  { header: 'Jenis', cell: (r) => r.revenueName, hideBelow: 'lg' },
  { header: 'Pokok', cell: (r) => formatRupiah(r.principal), align: 'right', hideBelow: 'md' },
  { header: 'Bunga', cell: (r) => formatRupiah(r.interest), align: 'right', hideBelow: 'lg' },
  { header: 'Total', cell: (r) => formatRupiah(r.total), align: 'right' },
  { header: 'Terlambat', cell: (r) => `${formatNumber(r.daysLate)} hari`, hideBelow: 'sm' },
  { header: 'Tahap', cell: (r) => <StatusBadge status={r.stage} map={STPD_STATUS_MAP} /> },
  {
    header: '',
    align: 'right',
    cell: (r) =>
      r.stpdId ? (
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link to="/penagihan/stpd/$id" params={{ id: toSlug(r.stpdId) }} />}
        >
          Buka STPD
        </Button>
      ) : (
        <Can permission="collections.create">
          <Button size="sm" nativeButton={false} render={<Link to="/penagihan/stpd/create" search={{ kind: r.ref.kind, id: r.ref.id }} />}>
            Terbitkan STPD
          </Button>
        </Can>
      ),
  },
]

function CollectionsPage() {
  const data = Route.useLoaderData()
  const { regions } = useAppData()
  const { search, setParams } = useTableParams()
  const activeBucket = search.bucket === undefined ? undefined : String(search.bucket)
  const totalAmount = data.stats.buckets.reduce((s, b) => s + b.amount, 0)
  const totalCount = data.stats.buckets.reduce((s, b) => s + b.count, 0)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Penagihan"
        description="Tunggakan yang melewati jatuh tempo. Terbitkan STPD (tagihan beserta bunga), lalu catat teguran, kunjungan, dan surat paksa."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link to="/penagihan/stpd" search={{}} />}>
            Daftar STPD
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card size="sm" className={cn(!activeBucket && 'ring-2 ring-primary')}>
          <button type="button" className="text-left" onClick={() => setParams({ bucket: undefined })}>
            <CardHeader>
              <CardDescription>Semua tunggakan</CardDescription>
              <CardTitle className="text-xl tabular-nums">{formatRupiahCompact(totalAmount)}</CardTitle>
              <div className="text-xs text-muted-foreground">{formatNumber(totalCount)} dokumen</div>
            </CardHeader>
          </button>
        </Card>
        {data.stats.buckets.map((b, i) => (
          <Card key={b.bucket} size="sm" className={cn(activeBucket === String(i) && 'ring-2 ring-primary')}>
            <button type="button" className="text-left" onClick={() => setParams({ bucket: String(i) })}>
              <CardHeader>
                <CardDescription>{b.bucket}</CardDescription>
                <CardTitle className="text-xl tabular-nums">{formatRupiahCompact(b.amount)}</CardTitle>
                <div className="text-xs text-muted-foreground">{formatNumber(b.count)} dokumen</div>
              </CardHeader>
            </button>
          </Card>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(r) => `${r.ref.kind}:${r.ref.id}`}
        searchPlaceholder="Cari wajib pajak atau dokumen…"
        rowClassName={(r) => (r.daysLate > 90 ? 'bg-destructive/5' : undefined)}
        emptyText={`Tidak ada tunggakan. Data per ${formatDate('2026-11-12')}.`}
        filters={[
          { key: 'taxCode', label: 'Jenis pendapatan', options: REVENUE_LINES.map((r) => ({ value: r.code, label: r.name })) },
          { key: 'distrik', label: 'Distrik', options: (regions.length ? regions : DISTRIK).map((d) => ({ value: d.id, label: d.name })) },
          {
            key: 'stage',
            label: 'Tahap',
            options: [
              { value: 'belum', label: 'Belum ditagih' },
              { value: 'issued', label: 'STPD terbit' },
              { value: 'reminded', label: 'Teguran' },
              { value: 'forced', label: 'Surat paksa' },
            ],
          },
        ]}
      />
    </div>
  )
}
