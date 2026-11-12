import { Button } from '@/components/ui/button'
import { PORT_LABEL, SERVICE_META, VESSEL_TYPE_LABEL, listPortBills, type PortBillRow } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { formatDate, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon, ShipIcon } from 'lucide-react'
import { Can, DataTable, DateField, PORT_STATUS_MAP, PageHeader, StatCard, StatGrid, StatusBadge, type Column } from '../../-components'
import { useTableParams } from '../../-hooks'
import { parseTableSearch, toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/retribusi/kepelabuhanan/')({
  head: () => ({ meta: [{ title: 'Kepelabuhanan | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listPortBills(deps),
  component: PortPage,
})

const columns: Array<Column<PortBillRow>> = [
  {
    header: 'No. tagihan',
    cell: (b) => (
      <Link to="/retribusi/kepelabuhanan/$id" params={{ id: toSlug(b.id) }} className="font-mono text-xs hover:underline">
        {b.id}
      </Link>
    ),
  },
  {
    header: 'Kapal',
    cell: (b) => (
      <div className="flex flex-col">
        <span className="font-medium">{b.vesselName}</span>
        <span className="text-xs text-muted-foreground">{b.vesselType ? VESSEL_TYPE_LABEL[b.vesselType] : 'Pas penumpang'}</span>
      </div>
    ),
  },
  { header: 'Pelabuhan', cell: (b) => PORT_LABEL[b.port], hideBelow: 'md' },
  { header: 'Layanan', cell: (b) => b.items.map((i) => SERVICE_META[i.service].label).join(', '), hideBelow: 'lg' },
  { header: 'Tanggal', cell: (b) => formatDate(b.serviceDate), hideBelow: 'sm' },
  { header: 'Total', cell: (b) => formatRupiah(b.total), align: 'right' },
  { header: 'Status', cell: (b) => <StatusBadge status={b.status} map={PORT_STATUS_MAP} /> },
]

function PortPage() {
  const data = Route.useLoaderData()
  const { search, setParams } = useTableParams()
  const from = typeof search.from === 'string' ? search.from : ''
  const to = typeof search.to === 'string' ? search.to : ''

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Retribusi pelayanan kepelabuhanan"
        description="Pas penumpang, jasa tambat dan labuh, bongkar muat, dan parkir di pelabuhan dan dermaga kabupaten."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link to="/retribusi/kepelabuhanan/kapal" search={{}} />}>
              <ShipIcon />
              Daftar kapal
            </Button>
            <Can permission="port.create">
              <Button nativeButton={false} render={<Link to="/retribusi/kepelabuhanan/create" />}>
                <PlusIcon />
                Buat tagihan
              </Button>
            </Can>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Penumpang hari ini" value={formatNumber(data.stats.passengersToday)} />
        <StatCard label="Kapal hari ini" value={formatNumber(data.stats.vesselsToday)} />
        <StatCard label="Penerimaan hari ini" value={formatRupiah(data.stats.amountToday)} />
        <StatCard label="Penerimaan tahun berjalan" value={formatRupiahCompact(data.stats.amountYtd)} />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(b) => b.id}
        searchPlaceholder="Cari no. tagihan atau kapal…"
        toolbar={
          <div className="flex items-end gap-2">
            <DateField
              label=""
              value={from}
              max={to || undefined}
              onChange={(v) => setParams({ from: v || undefined })}
              className="w-40 [&>label]:hidden"
            />
            <span className="pb-1.5 text-muted-foreground">s.d.</span>
            <DateField
              label=""
              value={to}
              min={from || undefined}
              onChange={(v) => setParams({ to: v || undefined })}
              className="w-40 [&>label]:hidden"
            />
          </div>
        }
        filters={[
          { key: 'port', label: 'Pelabuhan', options: toOptions(PORT_LABEL) },
          { key: 'type', label: 'Jenis kapal', options: toOptions(VESSEL_TYPE_LABEL) },
          {
            key: 'service',
            label: 'Layanan',
            options: (Object.keys(SERVICE_META) as Array<keyof typeof SERVICE_META>).map((k) => ({
              value: k,
              label: SERVICE_META[k].label,
            })),
          },
        ]}
      />
    </div>
  )
}
