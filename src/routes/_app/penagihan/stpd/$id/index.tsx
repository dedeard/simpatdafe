import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ACTION_LABEL, addCollectionAction, advanceStpd, createPaymentCode, getStpd, type ActionType } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { fromSlug, toSlug } from '@/lib/slug'
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { FileTextIcon, GavelIcon, Loader2Icon, MailWarningIcon, PlusIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ConfirmDialog,
  DateField,
  DetailCard,
  DocFields,
  DocumentPreview,
  PageHeader,
  SelectField,
  StatusBadge,
  STPD_STATUS_MAP,
  TextAreaField,
} from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'
import { toOptions } from '../../../-utils'

export const Route = createFileRoute('/_app/penagihan/stpd/$id/')({
  loader: ({ params }) => getStpd(fromSlug(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.id ?? 'STPD'} | SIMPATDA Raja Ampat` }] }),
  component: StpdDetailPage,
})

function ActionDialog({ stpdId }: { stpdId: string }) {
  const router = useRouter()
  const { users, roles } = useAppData()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ActionType | ''>('')
  const [date, setDate] = useState(TODAY)
  const [officer, setOfficer] = useState('')
  const [note, setNote] = useState('')
  const [promise, setPromise] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()
  const collectorRoles = new Set(roles.filter((r) => !r.system && r.permissions.includes('collections.read')).map((r) => r.id))
  const staff = users.filter((u) => u.status === 'active' && collectorRoles.has(u.roleId))

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon />
        Catat tindakan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat tindakan penagihan</DialogTitle>
            <DialogDescription>Riwayat tindakan tampil di linimasa STPD.</DialogDescription>
          </DialogHeader>
          {error && <FormAlert>{error}</FormAlert>}
          <SelectField
            label="Jenis tindakan"
            required
            value={type}
            error={errors.type}
            onChange={(v) => setType(v as ActionType)}
            options={toOptions(ACTION_LABEL)}
          />
          <DateField label="Tanggal" required value={date} max={TODAY} onChange={setDate} />
          <SelectField
            label="Petugas"
            required
            value={officer}
            error={errors.officer}
            onChange={setOfficer}
            options={staff.map((u) => ({ value: u.name, label: u.name }))}
          />
          {type === 'janji_bayar' && (
            <DateField label="Tanggal janji bayar" required value={promise} min={TODAY} error={errors.promise} onChange={setPromise} />
          )}
          <TextAreaField label="Catatan" required value={note} error={errors.note} onChange={setNote} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const e: Record<string, string> = {}
                  if (!type) e.type = 'Pilih jenis tindakan.'
                  if (!officer) e.officer = 'Pilih petugas.'
                  if (!note.trim()) e.note = 'Catatan wajib diisi.'
                  if (type === 'janji_bayar' && !promise) e.promise = 'Isi tanggal janji bayar.'
                  setErrors(e)
                  if (Object.keys(e).length > 0 || !type) return
                  await addCollectionAction({ id: stpdId, action: { type, date, officer, note, promiseDate: promise || undefined } })
                  toast.success('Tindakan dicatat.')
                  setOpen(false)
                  setNote('')
                  await router.invalidate()
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StpdDetailPage() {
  const s = Route.useLoaderData()
  const router = useRouter()
  const [advance, setAdvance] = useState<'reminded' | 'forced' | null>(null)
  const [docKind, setDocKind] = useState<'stpd' | 'teguran' | 'paksa' | null>(null)
  const sortedActions = [...s.actions].sort((a, b) => b.date.localeCompare(a.date))

  const docTitle = docKind === 'teguran' ? 'Surat Teguran' : docKind === 'paksa' ? 'Surat Paksa' : 'Surat Tagihan Pajak Daerah (STPD)'

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={s.id}
        description={`${s.revenueName} · ${s.payerName}`}
        back={{ to: '/penagihan/stpd', label: 'Daftar STPD' }}
        badge={<StatusBadge status={s.status} map={STPD_STATUS_MAP} />}
        actions={
          <>
            {s.status !== 'paid' && (
              <Button
                onClick={async () => {
                  const code = await createPaymentCode({ kind: 'stpd', id: s.id })
                  toast.success(`Kode bayar: ${code.paymentCode}`)
                  await router.navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
                }}
              >
                <WalletIcon />
                Buat kode bayar
              </Button>
            )}
            {s.status === 'issued' && (
              <Button variant="outline" onClick={() => setAdvance('reminded')}>
                <MailWarningIcon />
                Terbitkan teguran
              </Button>
            )}
            {s.status === 'reminded' && (
              <Button variant="outline" onClick={() => setAdvance('forced')}>
                <GavelIcon />
                Terbitkan surat paksa
              </Button>
            )}
            <Button variant="outline" onClick={() => setDocKind(docKind ? null : 'stpd')}>
              <FileTextIcon />
              {docKind ? 'Tutup dokumen' : 'Pratinjau STPD'}
            </Button>
          </>
        }
      />

      {docKind && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 print:hidden">
            {(
              [
                ['stpd', 'STPD'],
                ['teguran', 'Surat teguran'],
                ['paksa', 'Surat paksa'],
              ] as const
            ).map(([key, label]) => (
              <Button key={key} size="sm" variant={docKind === key ? 'default' : 'outline'} onClick={() => setDocKind(key)}>
                {label}
              </Button>
            ))}
          </div>
          <DocumentPreview title={docTitle} number={s.id} signatory="stpd">
            <DocFields
              rows={[
                ['Wajib pajak', s.payerName],
                ['NPWPD', s.npwpd ?? '-'],
                ['Dasar tagihan', s.sourceLabel],
                ['Pokok pajak', formatRupiah(s.principal)],
                [`Bunga (${s.months} bulan)`, formatRupiah(s.interest)],
                ['Total yang harus dibayar', formatRupiah(s.total)],
                ['Batas pembayaran', formatDate(s.dueDate, { dateStyle: 'long' })],
              ]}
            />
            {docKind !== 'stpd' && (
              <p className="text-justify">
                {docKind === 'teguran'
                  ? 'Berdasarkan data kami, kewajiban pajak di atas belum dilunasi sampai batas waktu yang ditentukan. Dengan ini kami menegur agar wajib pajak segera melunasi dalam waktu 7 (tujuh) hari sejak surat ini diterima.'
                  : 'Karena teguran tidak diindahkan, dengan surat ini wajib pajak diperintahkan melunasi seluruh tunggakan dalam waktu 2 x 24 jam. Jika tidak, penagihan dilanjutkan dengan penyitaan sesuai ketentuan peraturan perundang-undangan.'}
              </p>
            )}
          </DocumentPreview>
        </div>
      )}

      {!docKind && (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-4">
            <DetailCard
              title="Rincian tagihan"
              items={[
                {
                  label: 'Wajib pajak',
                  value: s.taxpayerId ? (
                    <Link to="/wajib-pajak/$id" params={{ id: s.taxpayerId }} className="hover:underline">
                      {s.payerName}
                    </Link>
                  ) : (
                    s.payerName
                  ),
                },
                { label: 'NPWPD', value: s.npwpd ? <span className="font-mono">{s.npwpd}</span> : undefined },
                { label: 'Dasar tagihan', value: s.sourceLabel },
                { label: 'Distrik', value: s.distrik },
                { label: 'Diterbitkan', value: formatDate(s.issuedAt) },
                { label: 'Batas pembayaran', value: formatDate(s.dueDate) },
                { label: 'Pokok pajak', value: formatRupiah(s.principal) },
                { label: `Bunga (${formatNumber(s.months)} bulan)`, value: formatRupiah(s.interest) },
                { label: 'Total tagihan', value: <span className="text-base">{formatRupiah(s.total)}</span> },
                { label: 'Dibayar', value: s.paidAt ? formatDateTime(s.paidAt) : undefined },
                { label: 'Catatan', value: s.note, wide: true },
              ]}
            />
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Linimasa penagihan</CardTitle>
              <CardDescription>{s.actions.length} tindakan tercatat</CardDescription>
              {s.status !== 'paid' && (
                <div className="pt-1">
                  <ActionDialog stpdId={s.id} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4 border-l pl-4">
                {sortedActions.map((a, i) => (
                  <li key={`${a.date}-${a.type}-${i}`} className="relative flex flex-col gap-0.5 text-sm">
                    <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-primary" />
                    <span className="font-medium">{ACTION_LABEL[a.type]}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(a.date)} · {a.officer}
                    </span>
                    <span>{a.note}</span>
                    {a.promiseDate && <span className="text-xs text-chart-3">Janji bayar {formatDate(a.promiseDate)}</span>}
                  </li>
                ))}
                {sortedActions.length === 0 && <li className="text-sm text-muted-foreground">Belum ada tindakan.</li>}
                <li className="relative flex flex-col gap-0.5 text-sm">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-muted-foreground" />
                  <span className="font-medium">STPD diterbitkan</span>
                  <span className="text-xs text-muted-foreground">{formatDate(s.issuedAt)}</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={advance !== null}
        onOpenChange={(o) => !o && setAdvance(null)}
        title={advance === 'forced' ? 'Terbitkan surat paksa?' : 'Terbitkan surat teguran?'}
        description={
          advance === 'forced'
            ? 'Surat paksa hanya dapat diterbitkan setelah teguran. Tindakan dicatat di linimasa.'
            : 'Tindakan dicatat di linimasa dan status berubah menjadi Teguran.'
        }
        confirmLabel="Terbitkan"
        onConfirm={async () => {
          if (!advance) return
          await advanceStpd({ id: s.id, to: advance })
          toast.success('Status penagihan diperbarui.')
          await router.invalidate()
        }}
      />
    </div>
  )
}
