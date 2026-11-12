import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createPaymentCode, decideSptpd, getSptpd } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleCheckIcon, CircleXIcon, FileTextIcon, SendIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ConfirmDialog,
  DetailCard,
  DocFields,
  DocTable,
  DocumentPreview,
  PageHeader,
  SPTPD_STATUS_MAP,
  StatusBadge,
} from '../../-components'

export const Route = createFileRoute('/_app/sptpd/$id/')({
  loader: ({ params }) => getSptpd(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'SPTPD'} | SIMPATDA Raja Ampat` }] }),
  component: SptpdDetailPage,
})

function SptpdDetailPage() {
  const s = Route.useLoaderData()
  const router = useRouter()
  const [dialog, setDialog] = useState<'verify' | 'reject' | null>(null)
  const [showDoc, setShowDoc] = useState(false)

  const act = async (action: 'submit' | 'verify' | 'reject', reason?: string) => {
    await decideSptpd({ id: s.id, action, reason })
    toast.success('Status SPTPD diperbarui.')
    await router.invalidate()
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={s.id}
        description={`${s.taxName} · masa ${monthLabel(s.period)}`}
        back={{ to: '/sptpd', label: 'Daftar SPTPD' }}
        badge={<StatusBadge status={s.status} map={SPTPD_STATUS_MAP} />}
        actions={
          <>
            {s.status === 'draft' && (
              <Button onClick={() => act('submit')}>
                <SendIcon />
                Laporkan
              </Button>
            )}
            {s.status === 'submitted' && (
              <>
                <Button onClick={() => setDialog('verify')}>
                  <CircleCheckIcon />
                  Verifikasi
                </Button>
                <Button variant="outline" onClick={() => setDialog('reject')}>
                  <CircleXIcon />
                  Tolak
                </Button>
              </>
            )}
            {s.status === 'verified' && !s.paidAt && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode({ kind: 'sptpd', id: s.id })
                  toast.success(`Kode bayar: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <WalletIcon />
                Buat kode bayar
              </Button>
            )}
            {s.status === 'verified' && s.paidAt && s.sspdId && (
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

      {s.status === 'rejected' && s.rejectionReason && <FormAlert>Ditolak: {s.rejectionReason}</FormAlert>}

      {showDoc ? (
        <DocumentPreview
          title="Surat Pemberitahuan Pajak Daerah (SPTPD)"
          number={s.id}
          signatory="sptpd"
          stamp={s.paidAt ? 'Telah dibayar' : undefined}
        >
          <DocFields
            rows={[
              ['Nama wajib pajak', s.taxpayerName],
              ['NPWPD', s.npwpd],
              ['Objek pajak', s.objectName],
              ['Jenis pajak', s.taxName],
              ['Masa pajak', monthLabel(s.period)],
            ]}
          />
          <DocTable
            head={['Uraian', 'Jumlah', 'Harga satuan', 'Nilai']}
            rows={s.lines.map((l) => [l.description, formatNumber(l.quantity), formatRupiah(l.unitPrice), formatRupiah(l.amount)])}
          />
          <DocFields
            rows={[
              ['Dasar pengenaan', formatRupiah(s.grossAmount)],
              ['Tarif', `${s.rate}%`],
              ['Pajak terutang', formatRupiah(s.taxDue)],
              ['Jatuh tempo', formatDate(s.dueDate, { dateStyle: 'long' })],
            ]}
          />
        </DocumentPreview>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-4">
            <DetailCard
              title="Informasi laporan"
              items={[
                {
                  label: 'Wajib pajak',
                  value: (
                    <Link to="/wajib-pajak/$id" params={{ id: s.taxpayerId }} className="hover:underline">
                      {s.taxpayerName}
                    </Link>
                  ),
                },
                { label: 'NPWPD', value: <span className="font-mono">{s.npwpd}</span> },
                { label: 'Objek pajak', value: s.objectName },
                { label: 'Distrik', value: s.distrik },
                { label: 'Dilaporkan', value: `${formatDateTime(s.filedAt)} oleh ${s.filedBy === 'wp' ? 'wajib pajak' : 'operator'}` },
                { label: 'Jatuh tempo', value: formatDate(s.dueDate) },
                { label: 'Diverifikasi', value: s.verifiedAt ? formatDateTime(s.verifiedAt) : undefined },
                { label: 'Lampiran', value: s.attachments.join(', ') || undefined, wide: true },
                { label: 'Catatan', value: s.note, wide: true },
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle>Rincian omzet</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Uraian</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Harga satuan</TableHead>
                      <TableHead className="pr-6 text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.lines.map((l) => (
                      <TableRow key={l.description}>
                        <TableCell className="pl-6">{l.description}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(l.quantity)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(l.unitPrice)}</TableCell>
                        <TableCell className="pr-6 text-right tabular-nums">{formatRupiah(l.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="pl-6 font-semibold">
                        Omzet total
                      </TableCell>
                      <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatRupiah(s.grossAmount)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Pajak terutang</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Omzet</span>
                <span className="tabular-nums">{formatRupiah(s.grossAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif</span>
                <span>{s.rate}%</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Terutang</span>
                <span className="tabular-nums">{formatRupiah(s.taxDue)}</span>
              </div>
              <div className="pt-1 text-xs text-muted-foreground">{s.paidAt ? `Dibayar ${formatDateTime(s.paidAt)}` : 'Belum dibayar'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={dialog === 'verify'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Verifikasi SPTPD?"
        description="Setelah diverifikasi, SPTPD dapat dibuatkan kode bayar."
        confirmLabel="Verifikasi"
        onConfirm={() => act('verify')}
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Tolak SPTPD?"
        description="Wajib pajak perlu mengajukan ulang laporan untuk masa ini."
        confirmLabel="Tolak"
        destructive
        askReason="Alasan penolakan"
        onConfirm={(reason) => act('reject', reason)}
      />
    </div>
  )
}
