import { STPD_STATUS_LABEL, listStpd, type StpdRow } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { formatDate, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { DataTable, PageHeader, STPD_STATUS_MAP, StatusBadge, type Column } from '../../-components'
import { parseTableSearch, toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/penagihan/stpd/')({
  head: () => ({ meta: [{ title: 'Daftar STPD | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listStpd(deps),
  component: StpdListPage,
})

const columns: Array<Column<StpdRow>> = [
  {
    header: 'No. STPD',
    cell: (s) => (
      <Link to="/penagihan/stpd/$id" params={{ id: toSlug(s.id) }} className="font-mono text-xs hover:underline">
        {s.id}
      </Link>
    ),
  },
  {
    header: 'Wajib pajak',
    cell: (s) => (
      <div className="flex flex-col">
        <span className="font-medium">{s.payerName}</span>
        <span className="text-xs text-muted-foreground">{s.revenueName}</span>
      </div>
    ),
  },
  { header: 'Terbit', cell: (s) => formatDate(s.issuedAt), hideBelow: 'md' },
  { header: 'Pokok', cell: (s) => formatRupiah(s.principal), align: 'right', hideBelow: 'lg' },
  { header: 'Total', cell: (s) => formatRupiah(s.total), align: 'right' },
  { header: 'Tindakan', cell: (s) => `${s.actions.length}`, align: 'right', hideBelow: 'sm' },
  { header: 'Status', cell: (s) => <StatusBadge status={s.status} map={STPD_STATUS_MAP} /> },
]

function StpdListPage() {
  const data = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Daftar STPD"
        description="Surat Tagihan Pajak Daerah yang sudah terbit."
        back={{ to: '/penagihan', label: 'Penagihan' }}
      />
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(s) => s.id}
        searchPlaceholder="Cari no. STPD atau nama…"
        filters={[{ key: 'status', label: 'Status', options: toOptions(STPD_STATUS_LABEL) }]}
      />
    </div>
  )
}
