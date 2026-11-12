import { Button } from '@/components/ui/button'
import { CHANNEL_LABEL, REVENUE_LINES, SSPD_STATUS_LABEL, listPayments, type SspdRow } from '@/lib/api/resources'
import { toSlug } from '@/lib/slug'
import { formatDateTime, formatNumber, formatRupiah, formatRupiahCompact } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRightLeftIcon, PlusIcon } from 'lucide-react'
import { Can, DataTable, DateField, PageHeader, SSPD_STATUS_MAP, StatCard, StatGrid, StatusBadge, type Column } from '../-components'
import { useTableParams } from '../-hooks'
import { parseTableSearch, toOptions } from '../-utils'

export const Route = createFileRoute('/_app/pembayaran/')({
  head: () => ({ meta: [{ title: 'Pembayaran | SIMPATDA Raja Ampat' }] }),
  validateSearch: parseTableSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listPayments(deps),
  component: PaymentsPage,
})

const columns: Array<Column<SspdRow>> = [
  {
    header: 'No. SSPD',
    cell: (s) => (
      <Link to="/pembayaran/$id" params={{ id: toSlug(s.id) }} className="flex flex-col hover:underline">
        <span className="font-mono text-xs">{s.id}</span>
        <span className="font-mono text-xs text-muted-foreground">{s.paymentCode}</span>
      </Link>
    ),
  },
  {
    header: 'Penyetor',
    cell: (s) => (
      <div className="flex flex-col">
        <span className="font-medium">{s.payerName}</span>
        <span className="text-xs text-muted-foreground">{s.revenueName}</span>
      </div>
    ),
  },
  { header: 'Kanal', cell: (s) => (s.channel ? CHANNEL_LABEL[s.channel] : '-'), hideBelow: 'md' },
  { header: 'Waktu', cell: (s) => formatDateTime(s.paidAt ?? s.createdAt), hideBelow: 'lg' },
  { header: 'Jumlah', cell: (s) => formatRupiah(s.amount), align: 'right' },
  { header: 'Status', cell: (s) => <StatusBadge status={s.status} map={SSPD_STATUS_MAP} /> },
]

function PaymentsPage() {
  const data = Route.useLoaderData()
  const { search, setParams } = useTableParams()
  const from = typeof search.from === 'string' ? search.from : ''
  const to = typeof search.to === 'string' ? search.to : ''

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Pembayaran"
        description="Kode bayar dan SSPD dari Bank Papua (teller, virtual account, QRIS) serta bendahara penerima."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/rekonsiliasi" search={{ date: '2026-11-11' }} />}>
              <ArrowRightLeftIcon />
              Rekonsiliasi
            </Button>
            <Can permission="payments.create">
              <Button nativeButton={false} render={<Link to="/pembayaran/create" />}>
                <PlusIcon />
                Buat kode bayar
              </Button>
            </Can>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Diterima" value={formatRupiahCompact(data.stats.received)} />
        <StatCard label="Jumlah transaksi" value={formatNumber(data.stats.count)} />
        <StatCard label="Menunggu bayar" value={formatNumber(data.stats.pendingCount)} tone="warning" />
        <StatCard label="Nilai menunggu bayar" value={formatRupiahCompact(data.stats.pendingAmount)} />
      </StatGrid>
      <DataTable
        columns={columns}
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        rowKey={(s) => s.id}
        searchPlaceholder="Cari no. SSPD, kode bayar, nama, ref. bank…"
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
          { key: 'channel', label: 'Kanal', options: toOptions(CHANNEL_LABEL) },
          { key: 'status', label: 'Status', options: toOptions(SSPD_STATUS_LABEL) },
          { key: 'revenue', label: 'Jenis pendapatan', options: REVENUE_LINES.map((r) => ({ value: r.code, label: r.name })) },
        ]}
      />
    </div>
  )
}
