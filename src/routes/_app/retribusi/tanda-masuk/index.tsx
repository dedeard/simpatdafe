import { Button } from '@/components/ui/button'
import { CATEGORY_LABEL, POINT_LABEL, listTickets, type TicketRow } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { formatDateTime, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon, TrendingUpIcon } from 'lucide-react'
import { Can, DataTable, DateField, PageHeader, StatCard, StatGrid, type Column } from '../../-components'
import { useTableParams } from '../../-hooks'
import { parseTableSearch, toOptions } from '../../-utils'

export const Route = createFileRoute('/_app/retribusi/tanda-masuk/')({
  head: () => ({ meta: [{ title: 'Tanda masuk wisata | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [list, today] = await Promise.all([listTickets(deps), listTickets({ from: TODAY, to: TODAY, pageSize: 1 })])
    return { list, today: today.stats }
  },
  component: TicketsPage,
})

const CHANNELS = { qris: 'QRIS', tunai: 'Tunai', va: 'Virtual account' }

const columns: Array<Column<TicketRow>> = [
  {
    header: 'No. tiket',
    cell: (t) => (
      <Link to="/retribusi/tanda-masuk/$id" params={{ id: toSlug(t.id) }} className="font-mono text-xs hover:underline">
        {t.id}
      </Link>
    ),
  },
  { header: 'Ketua rombongan', cell: (t) => t.leader },
  { header: 'Orang', cell: (t) => formatNumber(t.count), align: 'right' },
  {
    header: 'Kategori',
    hideBelow: 'md',
    cell: (t) =>
      (Object.keys(t.mix) as Array<keyof typeof t.mix>)
        .filter((k) => t.mix[k] > 0)
        .map((k) => `${t.mix[k]} ${CATEGORY_LABEL[k]}`)
        .join(', '),
  },
  { header: 'Loket', cell: (t) => POINT_LABEL[t.point], hideBelow: 'lg' },
  { header: 'Kanal', cell: (t) => CHANNELS[t.channel], hideBelow: 'lg' },
  { header: 'Waktu', cell: (t) => formatDateTime(t.soldAt), hideBelow: 'sm' },
  { header: 'Total', cell: (t) => formatRupiah(t.total), align: 'right' },
]

function TicketsPage() {
  const { list, today } = Route.useLoaderData()
  const { search, setParams } = useTableParams()
  const from = typeof search.from === 'string' ? search.from : ''
  const to = typeof search.to === 'string' ? search.to : ''

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Retribusi tanda masuk wisata"
        description="Penjualan tiket di loket UPTD Dinas Pariwisata dan pencocokan jumlah kunjungan dengan data BLUD kawasan konservasi."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/retribusi/tanda-masuk/rekonsiliasi" search={{ from: '2026-10-01', to: '2026-11-12' }} />}
            >
              <TrendingUpIcon />
              Rekonsiliasi
            </Button>
            <Can permission="tourism.create">
              <Button nativeButton={false} render={<Link to="/retribusi/tanda-masuk/create" />}>
                <PlusIcon />
                Jual tiket
              </Button>
            </Can>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Tiket hari ini" value={formatNumber(today.tickets)} />
        <StatCard
          label="Wisatawan hari ini"
          value={formatNumber(today.visitors)}
          hint={`${today.mix.mancanegara} mancanegara · ${today.mix.domestik + today.mix.lokal} domestik`}
        />
        <StatCard label="Penerimaan hari ini" value={formatRupiah(today.amount)} />
        <StatCard
          label={from || to ? 'Penerimaan rentang terpilih' : 'Penerimaan tahun berjalan'}
          value={formatRupiahCompact(list.stats.amount)}
          hint={`${formatNumber(list.stats.visitors)} wisatawan`}
        />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        rowKey={(t) => t.id}
        searchPlaceholder="Cari no. tiket atau nama…"
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
          { key: 'point', label: 'Loket', options: toOptions(POINT_LABEL) },
          { key: 'category', label: 'Kategori', options: toOptions(CATEGORY_LABEL) },
          { key: 'channel', label: 'Kanal', options: toOptions(CHANNELS) },
        ]}
      />
    </div>
  )
}
