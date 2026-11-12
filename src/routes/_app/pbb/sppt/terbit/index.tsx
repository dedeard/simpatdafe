import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { massIssueSppt, previewMassIssue, type MassIssuePreview } from '@/lib/api/resources'
import { formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog, FormSection, NumberField, PageHeader, SummaryCard } from '../../../-components'
import { useSubmit } from '../../../-hooks'

export const Route = createFileRoute('/_app/pbb/sppt/terbit/')({
  head: () => ({ meta: [{ title: 'Penetapan massal SPPT | SIMPATDA Raja Ampat' }] }),
  component: MassIssuePage,
})

function MassIssuePage() {
  const navigate = useNavigate()
  const [year, setYear] = useState<number | undefined>(2027)
  const [preview, setPreview] = useState<MassIssuePreview | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { pending, error, run } = useSubmit()

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Penetapan massal SPPT"
        description="Terbitkan SPPT untuk seluruh objek pajak pada satu tahun pajak. Setiap tahun hanya dapat diterbitkan satu kali."
        back={{ to: '/pbb/sppt', label: 'Daftar SPPT' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          <FormSection title="Tahun pajak">
            <NumberField
              label="Tahun"
              required
              min={2026}
              max={2035}
              value={year}
              onChange={(v) => {
                setYear(v)
                setPreview(null)
              }}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                disabled={pending || !year}
                onClick={() => run(async () => setPreview(await previewMassIssue(year ?? 0)))}
              >
                {pending && <Loader2Icon className="animate-spin" />}
                Pratinjau
              </Button>
            </div>
          </FormSection>
          {preview?.alreadyIssued && (
            <FormAlert>SPPT tahun {preview.year} sudah pernah diterbitkan dan tidak dapat diterbitkan ulang.</FormAlert>
          )}
          <div className="flex justify-end">
            <Button disabled={!preview || preview.alreadyIssued} onClick={() => setConfirmOpen(true)}>
              Terbitkan SPPT {preview?.year ?? ''}
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Pratinjau"
          rows={[
            { label: 'Tahun pajak', value: preview?.year ?? '-' },
            { label: 'Jumlah objek', value: preview ? formatNumber(preview.objects) : '-' },
            { label: 'Total NJOP', value: preview ? formatRupiah(preview.totalNjop) : '-' },
            { label: 'Objek kena batas minimum', value: preview ? formatNumber(preview.belowMinimum) : '-' },
          ]}
          total={{ label: 'Total ketetapan', value: preview ? formatRupiah(preview.totalAmount) : '-' }}
          footer="NJOPTKP diterapkan sekali per pemilik pada objek dengan NJOP tertinggi."
        />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Terbitkan SPPT ${preview?.year}?`}
        description={`${formatNumber(preview?.objects ?? 0)} SPPT senilai ${formatRupiah(preview?.totalAmount ?? 0)} akan dibuat. Tindakan ini tidak dapat diulang untuk tahun yang sama.`}
        confirmLabel="Terbitkan"
        onConfirm={async () => {
          if (!preview) return
          const result = await massIssueSppt(preview.year)
          toast.success(`${formatNumber(result.count)} SPPT diterbitkan.`)
          await navigate({ to: '/pbb/sppt', search: { year: preview.year } })
        }}
      />
    </div>
  )
}
