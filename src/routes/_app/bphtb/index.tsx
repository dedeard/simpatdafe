import { Button } from '@/components/ui/button'
import { BPHTB_STATUS_LABEL, BPHTB_TYPE_LABEL, PPAT_LIST, listBphtb, type BphtbRow } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { cn, formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { BPHTB_STATUS_MAP, Can, DataTable, PageHeader, StatCard, StatGrid, StatusBadge, type Column } from '../-components'
import { useTableParams } from '../-hooks'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/bphtb/')({
  head: () => ({ meta: [{ title: 'BPHTB | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listBphtb(deps),
  component: BphtbPage,
})

const columns: Array<Column<BphtbRow>> = [
  {
    header: 'No. pengajuan',
    cell: (f) => (
      <Link to="/bphtb/$id" params={{ id: toSlug(f.id) }} className="flex flex-col hover:underline">
        <span className="font-mono text-xs">{f.id}</span>
        <span className="font-mono text-xs text-muted-foreground">{f.nop}</span>
      </Link>
    ),
  },
  {
    header: 'Pembeli',
    cell: (f) => (
      <div className="flex flex-col">
        <span className="font-medium">{f.buyer.name}</span>
        <span className="text-xs text-muted-foreground">{BPHTB_TYPE_LABEL[f.transactionType]}</span>
      </div>
    ),
  },
  { header: 'Lokasi', cell: (f) => f.location, hideBelow: 'lg' },
  {
    header: 'NPOP',
    cell: (f) => <span className={cn(f.belowNjop && 'text-chart-3')}>{formatRupiahCompact(f.npop)}</span>,
    align: 'right',
    hideBelow: 'md',
  },
  { header: 'BPHTB', cell: (f) => formatRupiah(f.amount), align: 'right' },
  { header: 'PPAT', cell: (f) => f.ppat ?? '-', hideBelow: 'lg' },
  { header: 'Status', cell: (f) => <StatusBadge status={f.status} map={BPHTB_STATUS_MAP} /> },
]

function BphtbPage() {
  const data = Route.useLoaderData()
  const { search, setParams } = useTableParams()
  const tab = typeof search.status === 'string' && search.status === 'submitted' ? 'pending' : 'all'
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="BPHTB"
        description="Bea Perolehan Hak atas Tanah dan Bangunan: verifikasi harga transaksi terhadap NJOP, penerimaan pembayaran, dan validasi untuk pendaftaran peralihan hak."
        actions={
          <Can permission="bphtb.create">
            <Button nativeButton={false} render={<Link to="/bphtb/create" />}>
              <PlusIcon />
              Ajukan BPHTB
            </Button>
          </Can>
        }
      />
      <StatGrid className="xl:grid-cols-3">
        <StatCard label="Pengajuan" value={formatNumber(data.stats.total)} />
        <StatCard label="Perlu verifikasi" value={formatNumber(data.stats.pending)} tone={data.stats.pending > 0 ? 'warning' : 'default'} />
        <StatCard label="BPHTB diterima" value={formatRupiahCompact(data.stats.amount)} />
      </StatGrid>
      <div className="flex gap-1 border-b" role="tablist">
        {(
          [
            ['all', 'Semua'],
            ['pending', 'Perlu verifikasi'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams({ status: key === 'pending' ? 'submitted' : undefined })}
            className={cn(
              '-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground',
              tab === key && 'border-primary font-medium text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(f) => f.id}
        searchPlaceholder="Cari no., NOP, pembeli, penjual…"
        emptyText={`Tidak ada pengajuan. Terakhir diperbarui ${formatDate('2026-11-12')}.`}
        filters={[
          ...(tab === 'pending' ? [] : [{ key: 'status', label: 'Status', options: toOptions(BPHTB_STATUS_LABEL) }]),
          { key: 'type', label: 'Jenis transaksi', options: toOptions(BPHTB_TYPE_LABEL) },
          { key: 'ppat', label: 'PPAT', options: PPAT_LIST.map((p) => ({ value: p, label: p })) },
        ]}
      />
    </div>
  )
}
