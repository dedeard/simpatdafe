import { Button } from '@/components/ui/button'
import { ASSESSMENT_STATUS_LABEL, CODE, listAssessments, revenueName, type AssessmentRow } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { ASSESSMENT_STATUS_MAP, Can, DataTable, PageHeader, StatCard, StatGrid, StatusBadge, type Column } from '../-components'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/penetapan/')({
  head: () => ({ meta: [{ title: 'Penetapan | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAssessments(deps),
  component: AssessmentsPage,
})

const columns: Array<Column<AssessmentRow>> = [
  {
    header: 'No. ketetapan',
    cell: (a) => (
      <Link to="/penetapan/$id" params={{ id: toSlug(a.id) }} className="font-mono text-xs hover:underline">
        {a.id}
      </Link>
    ),
  },
  { header: 'Jenis', cell: (a) => (a.kind === 'skpdkb' ? 'SKPDKB' : 'SKPD'), hideBelow: 'sm' },
  {
    header: 'Wajib pajak',
    cell: (a) => (
      <div className="flex flex-col">
        <span className="font-medium">{a.taxpayerName}</span>
        <span className="text-xs text-muted-foreground">{a.taxName}</span>
      </div>
    ),
  },
  { header: 'Masa', cell: (a) => monthLabel(a.period), hideBelow: 'md' },
  { header: 'Total', cell: (a) => formatRupiah(a.total), align: 'right' },
  { header: 'Jatuh tempo', cell: (a) => (a.dueDate ? formatDate(a.dueDate) : '-'), hideBelow: 'lg' },
  { header: 'Status', cell: (a) => <StatusBadge status={a.status} map={ASSESSMENT_STATUS_MAP} /> },
]

function AssessmentsPage() {
  const data = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Penetapan"
        description="SKPD untuk reklame dan air tanah, serta SKPDKB hasil pemeriksaan hotel, restoran, dan usaha lain."
        actions={
          <Can permission="assessments.create">
            <Button nativeButton={false} render={<Link to="/penetapan/create" />}>
              <PlusIcon />
              Buat ketetapan
            </Button>
          </Can>
        }
      />
      <StatGrid>
        <StatCard label="Ketetapan terbit" value={formatNumber(data.stats.issued)} />
        <StatCard label="Total nilai" value={formatRupiahCompact(data.stats.total)} />
        <StatCard label="Jatuh tempo" value={formatNumber(data.stats.overdue)} tone={data.stats.overdue > 0 ? 'danger' : 'default'} />
        <StatCard label="Nilai jatuh tempo" value={formatRupiahCompact(data.stats.overdueAmount)} tone="danger" />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(a) => a.id}
        searchPlaceholder="Cari no. ketetapan, WP, objek…"
        rowClassName={(a) => (a.status === 'overdue' ? 'bg-destructive/5' : undefined)}
        filters={[
          {
            key: 'kind',
            label: 'Jenis',
            options: [
              { value: 'skpd', label: 'SKPD' },
              { value: 'skpdkb', label: 'SKPDKB' },
            ],
          },
          {
            key: 'taxCode',
            label: 'Jenis pajak',
            options: [CODE.reklame, CODE.airTanah, CODE.hotel, CODE.restaurant, CODE.mblb].map((c) => ({
              value: c,
              label: revenueName(c),
            })),
          },
          { key: 'status', label: 'Status', options: toOptions(ASSESSMENT_STATUS_LABEL) },
          { key: 'year', label: 'Tahun', options: [{ value: '2026', label: '2026' }] },
        ]}
      />
    </div>
  )
}
