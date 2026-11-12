import { Button } from '@/components/ui/button'
import { DISTRIK, USE_LABEL, listPbbObjects, type PbbObjectRow } from '@/lib/api/resources'
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { FileStackIcon, PlusIcon } from 'lucide-react'
import { Can, DataTable, PageHeader, SPPT_STATUS_MAP, StatCard, StatGrid, StatusBadge, type Column } from '../-components'
import { useAppData } from '../-hooks'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/pbb/')({
  head: () => ({ meta: [{ title: 'PBB-P2 | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listPbbObjects(deps),
  component: PbbPage,
})

const columns: Array<Column<PbbObjectRow>> = [
  {
    header: 'NOP',
    cell: (o) => (
      <Link to="/pbb/$nop" params={{ nop: o.nop }} className="font-mono text-xs hover:underline">
        {o.nop}
      </Link>
    ),
  },
  {
    header: 'Pemilik',
    cell: (o) => (
      <div className="flex flex-col">
        <span className="font-medium">{o.ownerName}</span>
        <span className="text-xs text-muted-foreground">
          {o.kampung}, {o.distrik}
        </span>
      </div>
    ),
  },
  { header: 'Penggunaan', cell: (o) => USE_LABEL[o.use], hideBelow: 'lg' },
  { header: 'Tanah / bangunan', cell: (o) => `${formatNumber(o.landArea)} / ${formatNumber(o.buildingArea)} m²`, hideBelow: 'md' },
  { header: 'NJOP', cell: (o) => formatRupiahCompact(o.njop), align: 'right', hideBelow: 'sm' },
  { header: 'PBB 2026', cell: (o) => (o.currentSppt ? formatRupiah(o.currentSppt.amount) : '-'), align: 'right' },
  { header: 'Status', cell: (o) => (o.currentSppt ? <StatusBadge status={o.currentSppt.status} map={SPPT_STATUS_MAP} /> : '-') },
]

function PbbPage() {
  const data = Route.useLoaderData()
  const { regions } = useAppData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="PBB-P2"
        description="Pajak Bumi dan Bangunan Perdesaan dan Perkotaan: register objek (NOP), nilai NJOP, dan SPPT tahunan."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link to="/pbb/sppt" search={{}} />}>
              <FileStackIcon />
              Daftar SPPT
            </Button>
            <Can permission="pbb.create">
              <Button nativeButton={false} render={<Link to="/pbb/objek/create" />}>
                <PlusIcon />
                Daftarkan objek
              </Button>
            </Can>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Objek pajak (NOP)" value={formatNumber(data.stats.objects)} />
        <StatCard label="Total NJOP" value={formatRupiahCompact(data.stats.njop)} />
        <StatCard label="Ketetapan SPPT 2026" value={formatRupiahCompact(data.stats.issuedAmount)} />
        <StatCard
          label="Sudah dibayar"
          value={formatRupiahCompact(data.stats.paidAmount)}
          hint={`${Math.round((data.stats.paidAmount / (data.stats.issuedAmount || 1)) * 1000) / 10}% dari ketetapan`}
        />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(o) => o.nop}
        searchPlaceholder="Cari NOP, pemilik, alamat…"
        filters={[
          { key: 'distrik', label: 'Distrik', options: (regions.length ? regions : DISTRIK).map((d) => ({ value: d.id, label: d.name })) },
          { key: 'use', label: 'Penggunaan', options: toOptions(USE_LABEL) },
          {
            key: 'status',
            label: 'Status SPPT',
            options: [
              { value: 'paid', label: 'Lunas' },
              { value: 'overdue', label: 'Jatuh tempo' },
              { value: 'issued', label: 'Terbit' },
            ],
          },
        ]}
      />
    </div>
  )
}
