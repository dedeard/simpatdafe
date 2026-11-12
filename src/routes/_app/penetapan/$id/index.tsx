import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { cancelAssessment, createPaymentCode, getAssessment, issueAssessment } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/utils'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { BanIcon, FileTextIcon, SendIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ASSESSMENT_STATUS_MAP, ConfirmDialog, DetailCard, DocFields, DocumentPreview, PageHeader, StatusBadge } from '../../-components'

export const Route = createFileRoute('/_app/penetapan/$id/')({
  loader: ({ params }) => getAssessment(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'Ketetapan'} | SIMPATDA Raja Ampat` }] }),
  component: AssessmentDetailPage,
})

function AssessmentDetailPage() {
  const a = Route.useLoaderData()
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const kindLabel = a.kind === 'skpdkb' ? 'SKPDKB' : 'SKPD'
  const canCancel = (a.status === 'issued' || a.status === 'overdue' || a.status === 'draft') && !a.paidAt

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={a.id}
        description={`${kindLabel} · ${a.taxName} · ${monthLabel(a.period)}`}
        back={{ to: '/penetapan', label: 'Daftar ketetapan' }}
        badge={<StatusBadge status={a.status} map={ASSESSMENT_STATUS_MAP} />}
        actions={
          <>
            {a.status === 'draft' && (
              <Button
                onClick={async () => {
                  const result = await issueAssessment(a.id)
                  toast.success('Ketetapan diterbitkan.')
                  await router.navigate({ to: '/penetapan/$id', params: { id: toSlug(result.id) } })
                }}
              >
                <SendIcon />
                Terbitkan
              </Button>
            )}
            {(a.status === 'issued' || a.status === 'overdue') && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode({ kind: 'skpd', id: a.id })
                  toast.success(`Kode bayar: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <WalletIcon />
                Buat kode bayar
              </Button>
            )}
            {a.status === 'paid' && a.sspdId && (
              <Button variant="outline" nativeButton={false} render={<Link to="/pembayaran/$id" params={{ id: toSlug(a.sspdId) }} />}>
                <WalletIcon />
                Lihat pembayaran
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <BanIcon />
                Batalkan
              </Button>
            )}
            {a.status !== 'draft' && (
              <Button variant="outline" onClick={() => setShowDoc(!showDoc)}>
                <FileTextIcon />
                {showDoc ? 'Tutup dokumen' : 'Pratinjau dokumen'}
              </Button>
            )}
          </>
        }
      />

      {a.status === 'cancelled' && a.cancelReason && <FormAlert>Dibatalkan: {a.cancelReason}</FormAlert>}

      {showDoc ? (
        <DocumentPreview
          title={a.kind === 'skpdkb' ? 'Surat Ketetapan Pajak Daerah Kurang Bayar' : 'Surat Ketetapan Pajak Daerah'}
          number={a.id}
          signatory="skpd"
          stamp={a.paidAt ? 'Telah dibayar' : undefined}
        >
          <DocFields
            rows={[
              ['Nama wajib pajak', a.taxpayerName],
              ['NPWPD', a.npwpd],
              ['Objek pajak', a.objectName],
              ['Jenis pajak', a.taxName],
              ['Masa / tahun pajak', monthLabel(a.period)],
              ...a.detail.map((d): [string, string] => [d.label, d.value]),
              ['Dasar pengenaan', formatRupiah(a.basis)],
              ['Tarif', `${a.rate}%`],
              ['Pokok pajak', formatRupiah(a.principal)],
              ...(a.kind === 'skpdkb'
                ? ([
                    ['Telah dibayar (SPTPD)', formatRupiah(a.previouslyPaid)],
                    ['Bunga / sanksi', formatRupiah(a.penalty)],
                  ] as Array<[string, string]>)
                : []),
              ['Jumlah yang harus dibayar', formatRupiah(a.total)],
              ['Jatuh tempo', a.dueDate ? formatDate(a.dueDate, { dateStyle: 'long' }) : '-'],
            ]}
          />
        </DocumentPreview>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard
            title="Informasi ketetapan"
            items={[
              {
                label: 'Wajib pajak',
                value: (
                  <Link to="/wajib-pajak/$id" params={{ id: a.taxpayerId }} className="hover:underline">
                    {a.taxpayerName}
                  </Link>
                ),
              },
              { label: 'NPWPD', value: <span className="font-mono">{a.npwpd}</span> },
              { label: 'Objek pajak', value: a.objectName },
              { label: 'Dibuat', value: formatDateTime(a.createdAt) },
              { label: 'Diterbitkan', value: a.issuedAt ? formatDateTime(a.issuedAt) : '-' },
              { label: 'Jatuh tempo', value: a.dueDate ? formatDate(a.dueDate) : '-' },
              { label: 'Dibayar', value: a.paidAt ? formatDateTime(a.paidAt) : undefined },
              { label: 'Catatan pemeriksaan', value: a.notes, wide: true },
            ]}
          />
          <DetailCard
            title="Perhitungan"
            items={[
              ...a.detail.map((d) => ({ label: d.label, value: d.value })),
              { label: 'Dasar pengenaan', value: formatRupiah(a.basis) },
              { label: 'Tarif', value: `${a.rate}%` },
              { label: 'Pokok pajak', value: formatRupiah(a.principal) },
              ...(a.kind === 'skpdkb'
                ? [
                    { label: 'Telah dibayar (SPTPD)', value: formatRupiah(a.previouslyPaid) },
                    { label: 'Bunga / sanksi', value: formatRupiah(a.penalty) },
                  ]
                : []),
              { label: 'Total', value: <span className="text-base">{formatRupiah(a.total)}</span> },
            ]}
          >
            {a.sourceSptpdId && a.sptpd && (
              <Link to="/sptpd/$id" params={{ id: toSlug(a.sourceSptpdId) }} className="text-sm text-primary hover:underline">
                Lihat SPTPD asal ({a.sourceSptpdId})
              </Link>
            )}
          </DetailCard>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Batalkan ketetapan?"
        description="Ketetapan yang dibatalkan tidak dapat dibayar. Tindakan ini tidak dapat diurungkan."
        confirmLabel="Batalkan ketetapan"
        destructive
        askReason="Alasan pembatalan"
        onConfirm={async (reason) => {
          await cancelAssessment({ id: a.id, reason })
          toast.success('Ketetapan dibatalkan.')
          await router.invalidate()
        }}
      />
    </div>
  )
}
