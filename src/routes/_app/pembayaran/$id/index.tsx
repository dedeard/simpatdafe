import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BILL_KIND_LABEL, CHANNEL_LABEL, createPaymentCode, getPayment, voidPayment } from '@/lib/api/resources'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { BanIcon, CopyIcon, FileTextIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { RecordPaymentDialog } from '../-components/RecordPaymentDialog'
import { ConfirmDialog, DetailCard, DocFields, DocumentPreview, PageHeader, SSPD_STATUS_MAP, StatusBadge } from '../../-components'
import { FakeQr } from '../../-components/FakeQr'

export const Route = createFileRoute('/_app/pembayaran/$id/')({
  loader: ({ params }) => getPayment(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.sspd.id ?? 'SSPD'} | SIMPATDA Raja Ampat` }] }),
  component: PaymentDetailPage,
})

const BILL_ROUTE = {
  sptpd: '/sptpd/$id',
  skpd: '/penetapan/$id',
  skrd: '/retribusi/skrd/$id',
  bphtb: '/bphtb/$id',
  port: '/retribusi/kepelabuhanan/$id',
  stpd: '/penagihan/stpd/$id',
} as const

function PaymentDetailPage() {
  const { sspd, billLabel, outstanding } = Route.useLoaderData()
  const router = useRouter()
  const [voidOpen, setVoidOpen] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const billKind = sspd.bill.kind

  const sourceLink =
    billKind in BILL_ROUTE ? (
      <Link to={BILL_ROUTE[billKind as keyof typeof BILL_ROUTE]} params={{ id: toSlug(sspd.bill.id) }} className="hover:underline">
        {billLabel}
      </Link>
    ) : billKind === 'sppt' ? (
      <Link to="/pbb/$nop" params={{ nop: sspd.bill.id.split('@')[0] }} className="hover:underline">
        {billLabel}
      </Link>
    ) : (
      billLabel
    )

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={sspd.id}
        description={`${BILL_KIND_LABEL[billKind]} · ${sspd.revenueName}`}
        back={{ to: '/pembayaran', label: 'Daftar pembayaran' }}
        badge={<StatusBadge status={sspd.status} map={SSPD_STATUS_MAP} />}
        actions={
          <>
            {sspd.status === 'pending' && (
              <>
                <RecordPaymentDialog sspd={sspd} />
                <Button variant="outline" onClick={() => setVoidOpen(true)}>
                  <BanIcon />
                  Batalkan
                </Button>
              </>
            )}
            {sspd.status === 'expired' && outstanding > 0 && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode(sspd.bill)
                  toast.success(`Kode bayar baru: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <RefreshCwIcon />
                Buat kode baru
              </Button>
            )}
            {sspd.status === 'paid' && (
              <Button variant="outline" onClick={() => setShowDoc(!showDoc)}>
                <FileTextIcon />
                {showDoc ? 'Tutup bukti' : 'Bukti pembayaran'}
              </Button>
            )}
          </>
        }
      />

      {sspd.status === 'void' && sspd.voidReason && <FormAlert>Dibatalkan: {sspd.voidReason}</FormAlert>}
      {sspd.status === 'expired' && <FormAlert>Kode bayar sudah kedaluwarsa. Buat kode baru bila tagihan belum lunas.</FormAlert>}

      {showDoc ? (
        <DocumentPreview
          title="Surat Setoran Pajak Daerah (SSPD)"
          number={sspd.id}
          signatory="laporan"
          stamp={`Telah dibayar · ${sspd.bankRef ?? ''}`}
          hideSignature
        >
          <DocFields
            rows={[
              ['Penyetor', sspd.payerName],
              ['NPWPD', sspd.npwpd ?? '-'],
              ['Jenis pendapatan', sspd.revenueName],
              ['Dasar pembayaran', billLabel],
              ['Kode bayar', sspd.paymentCode],
              ['Jumlah', formatRupiah(sspd.amount)],
              ['Kanal', sspd.channel ? CHANNEL_LABEL[sspd.channel] : '-'],
              ['No. referensi bank', sspd.bankRef ?? '-'],
              ['Dibayar', sspd.paidAt ? formatDateTime(sspd.paidAt) : '-'],
            ]}
          />
        </DocumentPreview>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <DetailCard
            title="Rincian pembayaran"
            items={[
              { label: 'Penyetor', value: sspd.payerName },
              { label: 'NPWPD', value: sspd.npwpd ? <span className="font-mono">{sspd.npwpd}</span> : undefined },
              { label: 'Dasar pembayaran', value: sourceLink },
              { label: 'Jenis pendapatan', value: sspd.revenueName },
              { label: 'Dibuat', value: formatDateTime(sspd.createdAt) },
              { label: 'Berlaku sampai', value: formatDateTime(sspd.expiresAt) },
              { label: 'Kanal', value: sspd.channel ? CHANNEL_LABEL[sspd.channel] : undefined },
              { label: 'Dibayar', value: sspd.paidAt ? formatDateTime(sspd.paidAt) : undefined },
              { label: 'No. referensi bank', value: sspd.bankRef ? <span className="font-mono">{sspd.bankRef}</span> : undefined },
              {
                label: 'Rekonsiliasi',
                value: sspd.status === 'paid' ? (sspd.reconciled ? 'Sudah cocok dengan mutasi bank' : 'Belum direkonsiliasi') : undefined,
              },
            ]}
          />
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Kode bayar</CardTitle>
              <CardDescription>Jumlah {formatRupiah(sspd.amount)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                <span className="font-mono text-lg tracking-wider">{sspd.paymentCode}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Salin kode bayar"
                  onClick={() => {
                    void navigator.clipboard?.writeText(sspd.paymentCode)
                    toast.success('Kode bayar disalin.')
                  }}
                >
                  <CopyIcon />
                </Button>
              </div>
              <Tabs defaultValue="teller">
                <TabsList>
                  <TabsTrigger value="teller">Teller</TabsTrigger>
                  <TabsTrigger value="va">VA</TabsTrigger>
                  <TabsTrigger value="qris">QRIS</TabsTrigger>
                  <TabsTrigger value="bendahara">Bendahara</TabsTrigger>
                </TabsList>
                <TabsContent value="teller" className="pt-2 text-sm text-muted-foreground">
                  Datang ke teller Bank Papua Cabang Raja Ampat dan sebutkan kode bayar di atas.
                </TabsContent>
                <TabsContent value="va" className="pt-2 text-sm text-muted-foreground">
                  Transfer ke virtual account <span className="font-mono text-foreground">8808 {sspd.paymentCode}</span> melalui ATM atau
                  mobile banking.
                </TabsContent>
                <TabsContent value="qris" className="flex flex-col items-center gap-2 pt-2 text-sm text-muted-foreground">
                  <FakeQr value={sspd.paymentCode} />
                  Pindai dengan aplikasi pembayaran apa pun.
                </TabsContent>
                <TabsContent value="bendahara" className="pt-2 text-sm text-muted-foreground">
                  Bayar tunai ke bendahara penerima BP2RD di Waisai, lalu minta bukti setor.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title="Batalkan SSPD?"
        description="Kode bayar tidak dapat dipakai lagi. Tagihan tetap belum lunas."
        confirmLabel="Batalkan SSPD"
        destructive
        askReason="Alasan pembatalan"
        onConfirm={async (reason) => {
          await voidPayment({ id: sspd.id, reason })
          toast.success('SSPD dibatalkan.')
          await router.invalidate()
        }}
      />
    </div>
  )
}
