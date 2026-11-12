import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cancelSkrd, createPaymentCode, getSkrd } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { BanIcon, FileTextIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ConfirmDialog,
  DetailCard,
  DocFields,
  DocTable,
  DocumentPreview,
  PageHeader,
  SKRD_STATUS_MAP,
  StatusBadge,
} from '../../../-components'

export const Route = createFileRoute('/_app/retribusi/skrd/$id/')({
  loader: ({ params }) => getSkrd(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'SKRD'} | SIMPATDA Raja Ampat` }] }),
  component: SkrdDetailPage,
})

function SkrdDetailPage() {
  const s = Route.useLoaderData()
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const period = s.period.length === 7 ? monthLabel(s.period) : formatDate(s.period)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={s.id}
        description={`${s.retributionName} · ${period}`}
        back={{ to: '/retribusi/skrd', label: 'Daftar SKRD' }}
        badge={<StatusBadge status={s.status} map={SKRD_STATUS_MAP} />}
        actions={
          <>
            {(s.status === 'issued' || s.status === 'overdue') && (
              <>
                <Button
                  onClick={async () => {
                    const code = await createPaymentCode({ kind: 'skrd', id: s.id })
                    toast.success(`Kode bayar: ${code.paymentCode}`)
                    await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                  }}
                >
                  <WalletIcon />
                  Buat kode bayar
                </Button>
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  <BanIcon />
                  Batalkan
                </Button>
              </>
            )}
            {s.status === 'paid' && s.sspdId && (
              <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/$id" params={{ id: toSlug(s.sspdId) }} />}>
                <WalletIcon />
                Lihat pembayaran
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDoc(!showDoc)}>
              <FileTextIcon />
              {showDoc ? 'Tutup dokumen' : 'Pratinjau dokumen'}
            </Button>
          </>
        }
      />
      {s.status === 'cancelled' && s.cancelReason && <FormAlert>Dibatalkan: {s.cancelReason}</FormAlert>}

      {showDoc ? (
        <DocumentPreview
          title="Surat Ketetapan Retribusi Daerah (SKRD)"
          number={s.id}
          signatory="skrd"
          stamp={s.paidAt ? 'Telah dibayar' : undefined}
        >
          <DocFields
            rows={[
              ['Jenis retribusi', s.retributionName],
              ['Nama penyetor', s.payerName],
              ['NPWPD', s.npwpd ?? '-'],
              ['Alamat', s.payerAddress || '-'],
              ['Periode', period],
            ]}
          />
          <DocTable
            head={['Uraian', 'Jumlah', 'Harga satuan', 'Nilai']}
            rows={s.lines.map((l) => [
              l.description,
              `${formatNumber(l.quantity)} ${l.unit}`,
              formatRupiah(l.unitPrice),
              formatRupiah(l.amount),
            ])}
          />
          <DocFields
            rows={[
              ['Total retribusi', formatRupiah(s.total)],
              ['Jatuh tempo', formatDate(s.dueDate, { dateStyle: 'long' })],
            ]}
          />
        </DocumentPreview>
      ) : (
        <>
          <DetailCard
            title="Informasi SKRD"
            items={[
              {
                label: 'Penyetor',
                value: s.taxpayerId ? (
                  <Link to="/wajib-pajak/$id" params={{ id: s.taxpayerId }} className="hover:underline">
                    {s.payerName}
                  </Link>
                ) : (
                  s.payerName
                ),
              },
              { label: 'NPWPD', value: s.npwpd ? <span className="font-mono">{s.npwpd}</span> : undefined },
              { label: 'Alamat', value: s.payerAddress || undefined, wide: true },
              { label: 'Diterbitkan', value: formatDate(s.issuedAt) },
              { label: 'Jatuh tempo', value: formatDate(s.dueDate) },
              { label: 'Dibayar', value: s.paidAt ? formatDateTime(s.paidAt) : undefined },
            ]}
          />
          <Card>
            <CardHeader>
              <CardTitle>Rincian</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Uraian</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Harga satuan</TableHead>
                    <TableHead className="pr-6 text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.lines.map((l) => (
                    <TableRow key={l.description}>
                      <TableCell className="pl-6">{l.description}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(l.quantity)} {l.unit}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatRupiah(l.unitPrice)}</TableCell>
                      <TableCell className="pr-6 text-right tabular-nums">{formatRupiah(l.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="pl-6 font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatRupiah(s.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Batalkan SKRD?"
        description="SKRD yang dibatalkan tidak dapat dibayar."
        confirmLabel="Batalkan SKRD"
        destructive
        askReason="Alasan pembatalan"
        onConfirm={async (reason) => {
          await cancelSkrd({ id: s.id, reason })
          toast.success('SKRD dibatalkan.')
          await router.invalidate()
        }}
      />
    </div>
  )
}
