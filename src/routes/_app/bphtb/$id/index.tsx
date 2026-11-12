import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BPHTB_TYPE_LABEL, createPaymentCode, decideBphtb, getBphtb } from '@/lib/api/resources'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleCheckIcon, CircleXIcon, FileTextIcon, Loader2Icon, ShieldCheckIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  BPHTB_STATUS_MAP,
  ConfirmDialog,
  DetailCard,
  DocFields,
  DocumentPreview,
  MoneyField,
  PageHeader,
  StatusBadge,
  TextAreaField,
} from '../../-components'
import { useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/bphtb/$id/')({
  loader: ({ params }) => getBphtb(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.filing.id ?? 'BPHTB'} | SIMPATDA Raja Ampat` }] }),
  component: BphtbDetailPage,
})

function VerifyDialog({
  id,
  declared,
  open,
  onOpenChange,
}: {
  id: string
  declared: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [adjust, setAdjust] = useState<number | undefined>()
  const [note, setNote] = useState('')
  const { pending, error, run } = useSubmit()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifikasi pengajuan</DialogTitle>
          <DialogDescription>
            Harga yang dilaporkan {formatRupiah(declared)}. Sesuaikan hanya bila hasil verifikasi lapangan berbeda.
          </DialogDescription>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <MoneyField label="Harga hasil verifikasi (opsional)" value={adjust} onChange={setAdjust} />
        <TextAreaField label="Catatan" required={adjust !== undefined} value={note} onChange={setNote} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Batal
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                await decideBphtb({ id, action: 'verify', note, adjustedNpop: adjust })
                toast.success('Pengajuan diverifikasi.')
                onOpenChange(false)
                await router.invalidate()
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Verifikasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BphtbDetailPage() {
  const { filing: f, object } = Route.useLoaderData()
  const router = useRouter()
  const [dialog, setDialog] = useState<'verify' | 'reject' | 'validate' | null>(null)
  const [showDoc, setShowDoc] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={f.id}
        description={`${BPHTB_TYPE_LABEL[f.transactionType]} · NOP ${f.nop}`}
        back={{ to: '/bphtb', label: 'Daftar BPHTB' }}
        badge={<StatusBadge status={f.status} map={BPHTB_STATUS_MAP} />}
        actions={
          <>
            {f.status === 'submitted' && (
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
            {f.status === 'verified' && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode({ kind: 'bphtb', id: f.id })
                  toast.success(`Kode bayar: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <WalletIcon />
                Buat kode bayar
              </Button>
            )}
            {f.status === 'paid' && (
              <Button onClick={() => setDialog('validate')}>
                <ShieldCheckIcon />
                Validasi
              </Button>
            )}
            {(f.status === 'paid' || f.status === 'validated') && f.sspdId && (
              <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/$id" params={{ id: toSlug(f.sspdId) }} />}>
                <WalletIcon />
                Lihat pembayaran
              </Button>
            )}
            {f.status === 'validated' && (
              <Button variant="outline" onClick={() => setShowDoc(!showDoc)}>
                <FileTextIcon />
                {showDoc ? 'Tutup dokumen' : 'SSPD BPHTB tervalidasi'}
              </Button>
            )}
          </>
        }
      />
      {f.status === 'rejected' && f.verificationNote && <FormAlert>Ditolak: {f.verificationNote}</FormAlert>}
      {f.belowNjop && f.status !== 'rejected' && (
        <FormAlert variant="success">Harga transaksi di bawah NJOP, dasar pengenaan memakai NJOP ({formatRupiah(f.njop)}).</FormAlert>
      )}

      {showDoc ? (
        <DocumentPreview title="Surat Setoran BPHTB (Tervalidasi)" number={f.id} signatory="laporan" stamp="Tervalidasi">
          <DocFields
            rows={[
              ['NOP', f.nop],
              ['Letak objek', f.location],
              ['Jenis perolehan', BPHTB_TYPE_LABEL[f.transactionType]],
              ['Pembeli', f.buyer.name],
              ['Penjual', f.seller.name],
              ['NPOP', formatRupiah(f.npop)],
              ['NPOPTKP', formatRupiah(f.npoptkp)],
              ['NPOPKP', formatRupiah(f.npopkp)],
              ['BPHTB yang dibayar', formatRupiah(f.amount)],
              ['Divalidasi', f.validatedAt ? formatDateTime(f.validatedAt) : '-'],
            ]}
          />
        </DocumentPreview>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard
            title="Transaksi"
            items={[
              { label: 'Jenis perolehan', value: BPHTB_TYPE_LABEL[f.transactionType] },
              { label: 'PPAT', value: f.ppat ?? '-' },
              { label: 'Pembeli', value: f.buyer.name },
              { label: 'NIK pembeli', value: <span className="font-mono">{f.buyer.nik}</span> },
              { label: 'Penjual', value: f.seller.name },
              { label: 'Diajukan', value: formatDateTime(f.submittedAt) },
              { label: 'Dibayar', value: f.paidAt ? formatDateTime(f.paidAt) : undefined },
              { label: 'Divalidasi', value: f.validatedAt ? formatDateTime(f.validatedAt) : undefined },
              { label: 'Lampiran', value: f.attachments.join(', '), wide: true },
              { label: 'Catatan verifikasi', value: f.verificationNote, wide: true },
            ]}
          />
          <div className="flex flex-col gap-4">
            <DetailCard
              title="Objek"
              items={[
                {
                  label: 'NOP',
                  value: (
                    <Link to="/pbb/$nop" params={{ nop: f.nop }} className="font-mono text-xs hover:underline">
                      {f.nop}
                    </Link>
                  ),
                },
                { label: 'Pemilik tercatat', value: object?.ownerName },
                { label: 'Lokasi', value: f.location },
                { label: 'Luas tanah / bangunan', value: `${formatNumber(f.landArea)} / ${formatNumber(f.buildingArea)} m²` },
              ]}
            />
            <DetailCard
              title="Perhitungan"
              items={[
                { label: 'Harga transaksi', value: formatRupiah(f.declaredPrice) },
                { label: 'NJOP', value: formatRupiah(f.njop) },
                { label: 'NPOP', value: formatRupiah(f.npop) },
                { label: 'NPOPTKP', value: formatRupiah(f.npoptkp) },
                { label: 'NPOPKP', value: formatRupiah(f.npopkp) },
                { label: `BPHTB (${f.rate}%)`, value: <span className="text-base">{formatRupiah(f.amount)}</span> },
              ]}
            />
          </div>
        </div>
      )}

      <VerifyDialog id={f.id} declared={f.declaredPrice} open={dialog === 'verify'} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Tolak pengajuan?"
        description="Pemohon perlu mengajukan ulang sebagai pengajuan baru."
        confirmLabel="Tolak"
        destructive
        askReason="Alasan penolakan"
        onConfirm={async (reason) => {
          await decideBphtb({ id: f.id, action: 'reject', note: reason })
          toast.success('Pengajuan ditolak.')
          await router.invalidate()
        }}
      />
      <ConfirmDialog
        open={dialog === 'validate'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Validasi pembayaran BPHTB?"
        description={`Pembayaran divalidasi untuk pendaftaran peralihan hak. Pemilik NOP berubah menjadi ${f.buyer.name} (tanggal ${formatDate('2026-11-12')}).`}
        confirmLabel="Validasi"
        onConfirm={async () => {
          await decideBphtb({ id: f.id, action: 'validate' })
          toast.success('BPHTB tervalidasi, pemilik NOP diperbarui.')
          await router.invalidate()
        }}
      />
    </div>
  )
}
