import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PORT_LABEL, SERVICE_META, VESSEL_TYPE_LABEL, createPaymentCode, getPortBill } from '@/lib/api/resources'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DetailCard, PORT_STATUS_MAP, PageHeader, StatusBadge } from '../../../-components'

export const Route = createFileRoute('/_app/retribusi/kepelabuhanan/$id/')({
  loader: ({ params }) => getPortBill(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'Tagihan pelabuhan'} | SIMPATDA Raja Ampat` }] }),
  component: PortBillPage,
})

function PortBillPage() {
  const b = Route.useLoaderData()
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={b.id}
        description={`${PORT_LABEL[b.port]} · ${formatDate(b.serviceDate)}`}
        back={{ to: '/retribusi/kepelabuhanan', label: 'Kepelabuhanan' }}
        badge={<StatusBadge status={b.status} map={PORT_STATUS_MAP} />}
        actions={
          b.status === 'unpaid' ? (
            <Button
              onClick={async () => {
                const code = await createPaymentCode({ kind: 'port', id: b.id })
                toast.success(`Kode bayar: ${code.paymentCode}`)
                await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
              }}
            >
              <WalletIcon />
              Buat kode bayar
            </Button>
          ) : b.sspdId ? (
            <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/$id" params={{ id: toSlug(b.sspdId) }} />}>
              <WalletIcon />
              Lihat pembayaran
            </Button>
          ) : undefined
        }
      />
      <DetailCard
        title="Informasi layanan"
        items={[
          { label: 'Pelabuhan', value: PORT_LABEL[b.port] },
          { label: 'Tanggal layanan', value: formatDate(b.serviceDate) },
          { label: 'Kapal', value: b.vesselName },
          { label: 'Jenis kapal', value: b.vesselType ? VESSEL_TYPE_LABEL[b.vesselType] : 'Penumpang umum' },
          { label: 'Gross tonnage', value: b.vessel ? `${formatNumber(b.vessel.grossTonnage)} GT` : undefined },
          { label: 'Pemilik', value: b.vessel?.owner },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Rincian retribusi</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Layanan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Tarif</TableHead>
                <TableHead className="pr-6 text-right">Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {b.items.map((i) => (
                <TableRow key={i.service}>
                  <TableCell className="pl-6">{SERVICE_META[i.service].label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(i.quantity)} {i.unit}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatRupiah(i.unitPrice)}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{formatRupiah(i.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="pl-6 font-semibold">
                  Total
                </TableCell>
                <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatRupiah(b.total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
