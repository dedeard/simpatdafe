import { Button } from '@/components/ui/button'
import { DISTRIK, listSppt, type SpptRow } from '@/lib/api/resources'
import { formatDate, formatNumber, formatPercent, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { StampIcon } from 'lucide-react'
import { Can, DataTable, PageHeader, SPPT_STATUS_MAP, StatCard, StatGrid, StatusBadge, type Column } from '../../-components'
import { useAppData } from '../../-hooks'
import { parseTableSearch } from '../../-utils'

export const Route = createFileRoute('/_app/pbb/sppt/')({
  head: () => ({ meta: [{ title: 'Daftar SPPT | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listSppt(deps),
  component: SpptPage,
})

const columns: Array<Column<SpptRow>> = [
  {
    header: 'NOP',
    cell: (s) => (
      <Link to="/pbb/$nop" params={{ nop: s.nop }} className="font-mono text-xs hover:underline">
        {s.nop}
      </Link>
    ),
  },
  {
    header: 'Pemilik',
    cell: (s) => (
      <div className="flex flex-col">
        <span className="font-medium">{s.ownerName}</span>
        <span className="text-xs text-muted-foreground">{s.location}</span>
      </div>
    ),
  },
  { header: 'NJOP', cell: (s) => formatRupiahCompact(s.njop), align: 'right', hideBelow: 'md' },
  { header: 'Tarif', cell: (s) => `${s.rate}%`, align: 'right', hideBelow: 'lg' },
  { header: 'PBB-P2', cell: (s) => formatRupiah(s.amount), align: 'right' },
  { header: 'Jatuh tempo', cell: (s) => formatDate(s.dueDate), hideBelow: 'lg' },
  { header: 'Status', cell: (s) => <StatusBadge status={s.status} map={SPPT_STATUS_MAP} /> },
]

function SpptPage() {
  const data = Route.useLoaderData()
  const { regions } = useAppData()
  const year = typeof data.rows[0]?.year === 'number' ? data.rows[0].year : 2026
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={`SPPT PBB-P2 ${year}`}
        description="Daftar SPPT dari penetapan massal. Urut dari ketetapan terbesar."
        back={{ to: '/pbb', label: 'Daftar objek' }}
        actions={
          <Can permission="pbb.create">
            <Button nativeButton={false} render={<Link to="/pbb/sppt/terbit" />}>
              <StampIcon />
              Penetapan massal
            </Button>
          </Can>
        }
      />
      <StatGrid>
        <StatCard label="Ketetapan" value={formatRupiahCompact(data.stats.issuedAmount)} />
        <StatCard label="Sudah dibayar" value={formatRupiahCompact(data.stats.paidAmount)} />
        <StatCard label="Belum dibayar" value={formatRupiahCompact(data.stats.issuedAmount - data.stats.paidAmount)} tone="danger" />
        <StatCard
          label="Capaian"
          value={formatPercent(data.stats.issuedAmount ? data.stats.paidAmount / data.stats.issuedAmount : 0)}
          hint={`${formatNumber(data.total)} SPPT pada filter ini`}
        />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(s) => `${s.nop}@${s.year}`}
        searchPlaceholder="Cari NOP atau pemilik…"
        rowClassName={(s) => (s.status === 'overdue' ? 'bg-destructive/5' : undefined)}
        filters={[
          { key: 'distrik', label: 'Distrik', options: (regions.length ? regions : DISTRIK).map((d) => ({ value: d.id, label: d.name })) },
          {
            key: 'status',
            label: 'Status',
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
