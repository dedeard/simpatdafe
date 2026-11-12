import { Button } from '@/components/ui/button'
import {
  REVENUE_BY_CODE,
  SELF_ASSESSED_CODES,
  SPTPD_STATUS_LABEL,
  listMissingSptpd,
  listSptpd,
  type MissingRow,
  type SptpdRow,
} from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { cn, formatNumber, formatPercent, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { Can, DataTable, DateField, PageHeader, SPTPD_STATUS_MAP, StatCard, StatGrid, StatusBadge, type Column } from '../-components'
import { useTableParams } from '../-hooks'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/sptpd/')({
  head: () => ({ meta: [{ title: 'Pendataan SPTPD | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const list = await listSptpd(deps)
    const missing = deps.tab === 'missing' ? await listMissingSptpd(deps) : undefined
    return { list, missing }
  },
  component: SptpdPage,
})

const listColumns: Array<Column<SptpdRow>> = [
  {
    header: 'No. SPTPD',
    cell: (s) => (
      <Link to="/sptpd/$id" params={{ id: toSlug(s.id) }} className="font-mono text-xs hover:underline">
        {s.id}
      </Link>
    ),
  },
  {
    header: 'Wajib pajak',
    cell: (s) => (
      <div className="flex flex-col">
        <span className="font-medium">{s.taxpayerName}</span>
        <span className="font-mono text-xs text-muted-foreground">{s.npwpd}</span>
      </div>
    ),
  },
  { header: 'Jenis pajak', cell: (s) => s.taxName, hideBelow: 'lg' },
  { header: 'Masa', cell: (s) => monthLabel(s.period), hideBelow: 'sm' },
  { header: 'Omzet', cell: (s) => formatRupiahCompact(s.grossAmount), align: 'right', hideBelow: 'md' },
  { header: 'Pajak terutang', cell: (s) => formatRupiah(s.taxDue), align: 'right' },
  { header: 'Status', cell: (s) => <StatusBadge status={s.status} map={SPTPD_STATUS_MAP} /> },
]

const missingColumns: Array<Column<MissingRow>> = [
  {
    header: 'Wajib pajak',
    cell: (m) => (
      <div className="flex flex-col">
        <span className="font-medium">{m.taxpayerName}</span>
        <span className="font-mono text-xs text-muted-foreground">{m.npwpd}</span>
      </div>
    ),
  },
  { header: 'Objek', cell: (m) => m.objectName, hideBelow: 'md' },
  { header: 'Jenis pajak', cell: (m) => m.taxName, hideBelow: 'lg' },
  { header: 'Distrik', cell: (m) => m.distrik, hideBelow: 'sm' },
]

const TABS = [
  { key: undefined, label: 'Semua' },
  { key: 'verify', label: 'Perlu verifikasi' },
  { key: 'missing', label: 'Belum lapor' },
] as const

function SptpdPage() {
  const { list, missing } = Route.useLoaderData()
  const { search, setParams } = useTableParams()
  const tab = typeof search.tab === 'string' ? search.tab : undefined
  const period = typeof search.period === 'string' ? search.period : list.stats.period
  const stats = list.stats

  const month = (
    <DateField
      label=""
      type="month"
      value={period}
      max="2026-10"
      onChange={(value) => setParams({ period: value || undefined })}
      className="w-40 [&>label]:hidden"
    />
  )

  const rowsForMissing: Array<Column<MissingRow>> = [
    ...missingColumns,
    {
      header: '',
      align: 'right',
      cell: (m) => (
        <Can permission="sptpd.create">
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link to="/sptpd/create" search={{ taxpayerId: m.taxpayerId, objectId: m.objectId, period }} />}
          >
            Buat SPTPD
          </Button>
        </Can>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Pendataan SPTPD"
        description="Laporan pajak self assessment bulanan: PBJT, MBLB, dan sarang burung walet. Verifikasi laporan masuk dan telusuri yang belum melapor."
        actions={
          <Can permission="sptpd.create">
            <Button
              nativeButton={false}
              render={<Link to="/sptpd/create" search={{ taxpayerId: undefined, objectId: undefined, period: undefined }} />}
            >
              <PlusIcon />
              Buat SPTPD
            </Button>
          </Can>
        }
      />
      <StatGrid>
        <StatCard label={`Wajib lapor ${monthLabel(stats.period)}`} value={formatNumber(stats.mustReport)} />
        <StatCard
          label="Sudah lapor"
          value={formatNumber(stats.reported)}
          hint={formatPercent(stats.mustReport ? stats.reported / stats.mustReport : 0)}
        />
        <StatCard label="Belum lapor" value={formatNumber(Math.max(stats.mustReport - stats.reported, 0))} tone="warning" />
        <StatCard label="Pajak terutang dilaporkan" value={formatRupiahCompact(stats.totalTax)} />
      </StatGrid>

      <div className="flex gap-1 border-b" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setParams({ tab: t.key })}
            className={cn(
              '-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground',
              tab === t.key && 'border-primary font-medium text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'missing' && missing ? (
        <DataTable
          columns={rowsForMissing}
          rows={missing.rows}
          total={missing.total}
          page={missing.page}
          pageSize={missing.pageSize}
          rowKey={(m) => m.objectId}
          searchPlaceholder="Cari wajib pajak atau objek…"
          toolbar={month}
          filters={[
            {
              key: 'taxCode',
              label: 'Jenis pajak',
              options: SELF_ASSESSED_CODES.map((c) => ({ value: c, label: REVENUE_BY_CODE[c].name })),
            },
          ]}
          emptyText="Semua wajib pajak sudah melapor untuk masa ini."
        />
      ) : (
        <DataTable
          columns={listColumns}
          rows={list.rows}
          total={list.total}
          page={list.page}
          pageSize={list.pageSize}
          rowKey={(s) => s.id}
          searchPlaceholder="Cari no. SPTPD, WP, objek…"
          toolbar={month}
          filters={[
            {
              key: 'taxCode',
              label: 'Jenis pajak',
              options: SELF_ASSESSED_CODES.map((c) => ({ value: c, label: REVENUE_BY_CODE[c].name })),
            },
            ...(tab === 'verify' ? [] : [{ key: 'status', label: 'Status', options: toOptions(SPTPD_STATUS_LABEL) }]),
          ]}
        />
      )}
    </div>
  )
}
