import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { createStpd, listWorklist, previewStpd, type BillKind } from '@/lib/api/resources'
import { TODAY, addDays, monthsLate } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { interestFor } from '@/lib/tax'
import { formatDate, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DateField, FormSection, PageHeader, ReadOnlyField, SelectField, SummaryCard, TextAreaField } from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'

export const Route = createFileRoute('/_app/penagihan/stpd/create/')({
  head: () => ({ meta: [{ title: 'Terbitkan STPD | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    kind: typeof search.kind === 'string' ? (search.kind as BillKind) : undefined,
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const candidates = await listWorklist({ stage: 'belum', pageSize: 50 })
    const preview = deps.kind && deps.id ? await previewStpd({ kind: deps.kind, id: deps.id }) : undefined
    return { candidates: candidates.rows, preview, selected: deps.kind && deps.id ? `${deps.kind}|${deps.id}` : '' }
  },
  component: CreateStpdPage,
})

function CreateStpdPage() {
  const { candidates, preview: initialPreview, selected: initialSelected } = Route.useLoaderData()
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [selected, setSelected] = useState(initialSelected)
  const [issuedAt, setIssuedAt] = useState(TODAY)
  const [note, setNote] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const { pending, error, run } = useSubmit()

  const current = candidates.find((c) => `${c.ref.kind}|${c.ref.id}` === selected)
  const principal = initialPreview && selected === initialSelected ? initialPreview.principal : (current?.principal ?? 0)
  const due = initialPreview && selected === initialSelected ? initialPreview.sourceDueDate : (current?.dueDate ?? TODAY)
  const label = initialPreview && selected === initialSelected ? initialPreview.label : (current?.label ?? '-')
  const payer = initialPreview && selected === initialSelected ? initialPreview.payerName : (current?.payerName ?? '-')
  const months = monthsLate(due, issuedAt)
  const interest = interestFor(principal, months, tariffs, issuedAt)

  const options = candidates.map((c) => ({ value: `${c.ref.kind}|${c.ref.id}`, label: `${c.payerName} · ${c.label}` }))
  if (initialSelected && !options.some((o) => o.value === initialSelected) && initialPreview)
    options.unshift({ value: initialSelected, label: `${initialPreview.payerName} · ${initialPreview.label}` })

  const submit = () =>
    run(async () => {
      if (!selected) return setFieldError('Pilih dokumen tunggakan.')
      if (issuedAt > TODAY || issuedAt <= due) return setFieldError('Tanggal terbit harus setelah jatuh tempo dan tidak di masa depan.')
      setFieldError(undefined)
      const [kind, ...rest] = selected.split('|')
      const result = await createStpd({ source: { kind: kind as BillKind, id: rest.join('|') }, issuedAt, note: note.trim() || undefined })
      toast.success('STPD diterbitkan.')
      await navigate({ to: '/penagihan/stpd/$id', params: { id: toSlug(result.id) } })
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Terbitkan STPD"
        description="Tagih pokok pajak beserta bunga keterlambatan (maksimal 24 bulan)."
        back={{ to: '/penagihan', label: 'Penagihan' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {(error || fieldError) && <FormAlert>{error ?? fieldError}</FormAlert>}
          <FormSection title="Dokumen tunggakan" description="Menampilkan 50 tunggakan terlama yang belum memiliki STPD.">
            <SelectField className="sm:col-span-2" label="Dokumen" required value={selected} onChange={setSelected} options={options} />
            <DateField label="Tanggal terbit" required value={issuedAt} max={TODAY} min={addDays(due, 1)} onChange={setIssuedAt} />
            <ReadOnlyField label="Jatuh tempo asal" value={selected ? formatDate(due) : '-'} />
            <TextAreaField className="sm:col-span-2" label="Catatan" value={note} onChange={setNote} />
          </FormSection>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2Icon className="animate-spin" />}
              Terbitkan STPD
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Perhitungan"
          rows={[
            { label: 'Wajib pajak', value: payer },
            { label: 'Dokumen', value: label },
            { label: 'Pokok', value: formatRupiah(principal) },
            { label: 'Bulan keterlambatan', value: `${Math.min(months, 24)}${months > 24 ? ' (dibatasi 24)' : ''}` },
            { label: 'Bunga', value: formatRupiah(interest) },
          ]}
          total={{ label: 'Total tagihan', value: formatRupiah(principal + interest) }}
          footer="Jatuh tempo STPD: 30 hari sejak tanggal terbit."
        />
      </div>
    </div>
  )
}
