import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CATEGORY_LABEL, POINT_LABEL, getTicket } from '@/lib/api/resources'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PrinterIcon, WalletIcon } from 'lucide-react'
import { DetailCard, PageHeader } from '../../../-components'
import { FakeQr } from '../../../-components/FakeQr'

export const Route = createFileRoute('/_app/retribusi/tanda-masuk/$id/')({
  loader: ({ params }) => getTicket(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'Tiket'} | SIMPATDA Raja Ampat` }] }),
  component: TicketDetailPage,
})

function TicketDetailPage() {
  const t = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={t.id}
        description={`${POINT_LABEL[t.point]} · ${t.visitors.length} pengunjung`}
        back={{ to: '/retribusi/tanda-masuk', label: 'Daftar tiket' }}
        actions={
          <>
            {t.sspdId && (
              <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/$id" params={{ id: toSlug(t.sspdId) }} />}>
                <WalletIcon />
                Lihat SSPD
              </Button>
            )}
            <Button onClick={() => window.print()}>
              <PrinterIcon />
              Cetak tiket
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] print:hidden">
        <DetailCard
          title="Informasi tiket"
          items={[
            { label: 'Loket', value: POINT_LABEL[t.point] },
            { label: 'Petugas', value: t.officer },
            { label: 'Terbit', value: formatDateTime(t.soldAt) },
            { label: 'Berlaku', value: `${formatDate(t.validFrom)} s.d. ${formatDate(t.validUntil)}` },
            { label: 'Kanal bayar', value: t.channel.toUpperCase() },
            { label: 'Total', value: <span className="text-base">{formatRupiah(t.total)}</span> },
          ]}
        />
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Tarif per orang</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {(['mancanegara', 'domestik', 'lokal'] as const).map((c) => (
              <div key={c} className="flex justify-between">
                <span className="text-muted-foreground">{CATEGORY_LABEL[c]}</span>
                <span className="tabular-nums">{formatRupiah(t.tariffs[c])}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Pengunjung</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nama</TableHead>
                <TableHead>Kebangsaan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="pr-6">Identitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.visitors.map((v, i) => (
                <TableRow key={`${v.idNumber}-${i}`}>
                  <TableCell className="pl-6 font-medium">{v.name}</TableCell>
                  <TableCell>{v.nationality}</TableCell>
                  <TableCell>{CATEGORY_LABEL[v.category]}</TableCell>
                  <TableCell className="pr-6 font-mono text-xs">{v.idNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="print-area hidden flex-col gap-4 bg-white p-4 text-neutral-900 print:flex">
        <div className="text-center">
          <p className="text-xs tracking-wide">PEMERINTAH KABUPATEN RAJA AMPAT</p>
          <p className="text-base font-bold">TANDA MASUK WISATA RAJA AMPAT</p>
          <p className="font-mono text-xs">{t.id}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {t.visitors.map((v, i) => (
            <div key={`${v.idNumber}-${i}`} className="flex items-center gap-3 rounded border border-neutral-400 p-3">
              <FakeQr value={`${t.id}-${i}`} size={84} />
              <div className="flex min-w-0 flex-col text-xs">
                <span className="truncate text-sm font-bold">{v.name}</span>
                <span>{CATEGORY_LABEL[v.category]}</span>
                <span className="font-mono">{v.idNumber}</span>
                <span>Berlaku s.d. {formatDate(t.validUntil)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
