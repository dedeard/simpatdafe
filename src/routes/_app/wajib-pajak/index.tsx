import { Button } from '@/components/ui/button'
import { DISTRIK, ENTITY_LABEL, SECTORS, TAXPAYER_STATUS_LABEL, listTaxpayers, type TaxpayerRow } from '@/lib/api/resources'
import { formatDate, formatNumber } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { Can, DataTable, PageHeader, StatCard, StatGrid, StatusBadge, TAXPAYER_STATUS_MAP, type Column } from '../-components'
import { useAppData } from '../-hooks'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/wajib-pajak/')({
  head: () => ({ meta: [{ title: 'Pendaftaran WP | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listTaxpayers(deps),
  component: TaxpayersPage,
})

const columns: Array<Column<TaxpayerRow>> = [
  {
    header: 'Wajib pajak',
    cell: (t) => (
      <Link to="/wajib-pajak/$id" params={{ id: t.id }} className="flex flex-col hover:underline">
        <span className="font-medium">{t.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{t.npwpd ?? 'NPWPD belum terbit'}</span>
      </Link>
    ),
  },
  { header: 'Jenis', cell: (t) => ENTITY_LABEL[t.type], hideBelow: 'md' },
  { header: 'Sektor', cell: (t) => t.sector, hideBelow: 'lg' },
  { header: 'Distrik', cell: (t) => t.distrik, hideBelow: 'md' },
  { header: 'Objek', cell: (t) => formatNumber(t.objectCount), align: 'right', hideBelow: 'sm' },
  { header: 'Terdaftar', cell: (t) => formatDate(t.registeredAt), hideBelow: 'lg' },
  { header: 'Status', cell: (t) => <StatusBadge status={t.status} map={TAXPAYER_STATUS_MAP} /> },
]

function TaxpayersPage() {
  const data = Route.useLoaderData()
  const { regions } = useAppData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Pendaftaran Wajib Pajak"
        description="Daftar wajib pajak daerah, penerbitan NPWPD, dan objek pajak (hotel, homestay, rumah makan, galian)."
        actions={
          <Can permission="taxpayers.create">
            <Button nativeButton={false} render={<Link to="/wajib-pajak/create" />}>
              <PlusIcon />
              Daftarkan WP
            </Button>
          </Can>
        }
      />
      <StatGrid className="xl:grid-cols-3">
        <StatCard label="WP aktif" value={formatNumber(data.stats.active)} />
        <StatCard
          label="Menunggu verifikasi"
          value={formatNumber(data.stats.verification)}
          tone={data.stats.verification > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Pendaftaran baru bulan ini" value={formatNumber(data.stats.newThisMonth)} />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(t) => t.id}
        searchPlaceholder="Cari NPWPD, nama usaha, pemilik…"
        filters={[
          { key: 'status', label: 'Status', options: toOptions(TAXPAYER_STATUS_LABEL) },
          { key: 'distrik', label: 'Distrik', options: (regions.length ? regions : DISTRIK).map((d) => ({ value: d.id, label: d.name })) },
          { key: 'sector', label: 'Sektor', options: SECTORS.map((s) => ({ value: s, label: s })) },
        ]}
      />
    </div>
  )
}
