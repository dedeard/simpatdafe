import { VESSEL_TYPE_LABEL, listVessels, type VesselRow } from '@/lib/api/resources'
import { formatNumber } from '@/lib/utils'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { VesselDialog } from '../-components/VesselDialog'
import { DataTable, PageHeader, type Column } from '../../../-components'
import { parseTableSearch, toOptions } from '../../../-utils'

export const Route = createFileRoute('/_app/retribusi/kepelabuhanan/kapal/')({
  head: () => ({ meta: [{ title: 'Daftar kapal | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listVessels(deps),
  component: VesselsPage,
})

const columns: Array<Column<VesselRow>> = [
  {
    header: 'Kapal',
    cell: (v) => (
      <div className="flex flex-col">
        <span className="font-medium">{v.name}</span>
        <span className="text-xs text-muted-foreground">{v.owner}</span>
      </div>
    ),
  },
  { header: 'Jenis', cell: (v) => VESSEL_TYPE_LABEL[v.type] },
  { header: 'GT', cell: (v) => formatNumber(v.grossTonnage), align: 'right' },
  { header: 'Pelabuhan asal', cell: (v) => v.homePort, hideBelow: 'md' },
  { header: 'Kunjungan', cell: (v) => formatNumber(v.visits), align: 'right' },
]

function VesselsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Daftar kapal"
        description="Kapal yang pernah dilayani di pelabuhan dan dermaga kabupaten."
        back={{ to: '/retribusi/kepelabuhanan', label: 'Kepelabuhanan' }}
        actions={<VesselDialog onCreated={() => router.invalidate()} label="Daftarkan kapal" />}
      />
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(v) => v.id}
        searchPlaceholder="Cari nama kapal atau pemilik…"
        filters={[{ key: 'type', label: 'Jenis kapal', options: toOptions(VESSEL_TYPE_LABEL) }]}
      />
    </div>
  )
}
