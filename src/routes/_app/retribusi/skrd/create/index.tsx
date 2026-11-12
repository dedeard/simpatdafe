import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { SKRD_CODES, createSkrd, revenueName, type TaxpayerPick } from '@/lib/api/resources'
import { TODAY, addDays } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { tariffValue } from '@/lib/tax'
import { formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  DateField,
  FormSection,
  MoneyField,
  NumberField,
  PageHeader,
  SelectField,
  SummaryCard,
  TaxpayerPicker,
  TextAreaField,
  TextField,
} from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'

export const Route = createFileRoute('/_app/retribusi/skrd/create/')({
  head: () => ({ meta: [{ title: 'Buat SKRD | SIMPATDA Raja Ampat' }] }),
  component: CreateSkrdPage,
})

type Line = { description: string; quantity: number | undefined; unit: string; unitPrice: number | undefined }

const PRESETS: Record<string, Line> = {
  '4.1.02.01': { description: 'Retribusi persampahan', quantity: 1, unit: 'bulan', unitPrice: undefined },
  '4.1.02.03': { description: 'Retribusi PBG', quantity: undefined, unit: 'm²', unitPrice: undefined },
  '4.1.02.05': { description: 'Sewa', quantity: 1, unit: 'hari', unitPrice: undefined },
}

function CreateSkrdPage() {
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [code, setCode] = useState('')
  const [useTaxpayer, setUseTaxpayer] = useState(true)
  const [taxpayer, setTaxpayer] = useState<TaxpayerPick | null>(null)
  const [payerName, setPayerName] = useState('')
  const [payerAddress, setPayerAddress] = useState('')
  const [period, setPeriod] = useState(TODAY)
  const [dueDate, setDueDate] = useState(addDays(TODAY, 30))
  const [lines, setLines] = useState<Array<Line>>([])
  const [index, setIndex] = useState<number | undefined>(1.5)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const pickCode = (next: string) => {
    setCode(next)
    const preset = PRESETS[next]
    if (!preset) return setLines([])
    const unit =
      next === '4.1.02.03'
        ? Math.round(tariffValue(tariffs, 'pbg.unit') * (index ?? 1))
        : next === '4.1.02.01'
          ? tariffValue(tariffs, 'waste.homestay')
          : undefined
    setLines([{ ...preset, unitPrice: unit }])
  }

  const setIndexAndPrice = (value: number | undefined) => {
    setIndex(value)
    if (code === '4.1.02.03' && value)
      setLines(lines.map((l) => ({ ...l, unitPrice: Math.round(tariffValue(tariffs, 'pbg.unit') * value) })))
  }

  const update = (i: number, patch: Partial<Line>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)))
  const total = lines.reduce((s, l) => s + Math.round((l.quantity ?? 0) * (l.unitPrice ?? 0)), 0)

  const submit = () =>
    run(async () => {
      const e: Record<string, string> = {}
      if (!code) e.code = 'Pilih jenis retribusi.'
      if (useTaxpayer && !taxpayer) e.payer = 'Pilih wajib pajak.'
      if (!useTaxpayer && !payerName.trim()) e.payer = 'Nama penyetor wajib diisi.'
      if (!period) e.period = 'Periode wajib diisi.'
      if (dueDate < TODAY) e.due = 'Jatuh tempo tidak boleh sebelum hari ini.'
      if (lines.length === 0 || lines.some((l) => !l.description.trim() || !(l.quantity && l.quantity > 0) || l.unitPrice === undefined))
        e.lines = 'Lengkapi semua baris rincian.'
      setErrors(e)
      if (Object.keys(e).length > 0) return
      const result = await createSkrd({
        retributionCode: code,
        taxpayerId: useTaxpayer ? taxpayer?.id : undefined,
        payerName: useTaxpayer ? (taxpayer?.name ?? '') : payerName,
        payerAddress: useTaxpayer ? '' : payerAddress,
        period,
        dueDate,
        lines: lines.map((l) => ({ description: l.description, quantity: l.quantity ?? 0, unit: l.unit, unitPrice: l.unitPrice ?? 0 })),
      })
      toast.success('SKRD diterbitkan.')
      await navigate({ to: '/retribusi/skrd/$id', params: { id: toSlug(result.id) } })
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Buat SKRD"
        description="Terbitkan ketetapan retribusi untuk wajib pajak terdaftar maupun penyetor umum."
        back={{ to: '/retribusi/skrd', label: 'Daftar SKRD' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          <FormSection title="Jenis retribusi">
            <SelectField
              className="sm:col-span-2"
              label="Jenis retribusi"
              required
              value={code}
              error={errors.code}
              onChange={pickCode}
              options={SKRD_CODES.map((c) => ({ value: c, label: revenueName(c) }))}
            />
          </FormSection>
          <FormSection title="Penyetor">
            <div className="flex gap-2 sm:col-span-2">
              <Button type="button" size="sm" variant={useTaxpayer ? 'default' : 'outline'} onClick={() => setUseTaxpayer(true)}>
                Wajib pajak terdaftar
              </Button>
              <Button type="button" size="sm" variant={useTaxpayer ? 'outline' : 'default'} onClick={() => setUseTaxpayer(false)}>
                Penyetor umum
              </Button>
            </div>
            {useTaxpayer ? (
              <div className="sm:col-span-2">
                <TaxpayerPicker required value={taxpayer} error={errors.payer} onChange={setTaxpayer} />
              </div>
            ) : (
              <>
                <TextField label="Nama penyetor" required value={payerName} error={errors.payer} onChange={setPayerName} />
                <TextAreaField label="Alamat" value={payerAddress} onChange={setPayerAddress} rows={2} />
              </>
            )}
            <DateField label="Periode / tanggal" required value={period} error={errors.period} onChange={setPeriod} />
            <DateField label="Jatuh tempo" required value={dueDate} min={TODAY} error={errors.due} onChange={setDueDate} />
          </FormSection>
          <FormSection
            title="Rincian"
            description={code === '4.1.02.03' ? 'PBG: luas bangunan × indeks terintegrasi × harga satuan.' : undefined}
          >
            <div className="flex flex-col gap-3 sm:col-span-2">
              {errors.lines && <FormAlert>{errors.lines}</FormAlert>}
              {code === '4.1.02.03' && (
                <NumberField label="Indeks terintegrasi" step="0.01" min={1} max={3} value={index} onChange={setIndexAndPrice} />
              )}
              {lines.map((l, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_6rem_6rem_10rem_auto] sm:items-end">
                  <TextField label="Uraian" value={l.description} onChange={(description) => update(i, { description })} />
                  <NumberField label="Jumlah" min={0} value={l.quantity} onChange={(quantity) => update(i, { quantity })} />
                  <TextField label="Satuan" value={l.unit} onChange={(unit) => update(i, { unit })} />
                  <MoneyField label="Harga satuan" value={l.unitPrice} onChange={(unitPrice) => update(i, { unitPrice })} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus baris"
                    disabled={lines.length === 1}
                    onClick={() => setLines(lines.filter((_, k) => k !== i))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              {code && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines([...lines, { description: '', quantity: undefined, unit: 'unit', unitPrice: undefined }])}
                  >
                    <PlusIcon />
                    Tambah baris
                  </Button>
                </div>
              )}
            </div>
          </FormSection>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2Icon className="animate-spin" />}
              Terbitkan SKRD
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Ringkasan"
          rows={[
            { label: 'Jenis', value: code ? revenueName(code) : '-' },
            { label: 'Penyetor', value: (useTaxpayer ? taxpayer?.name : payerName) || '-' },
            { label: 'Baris rincian', value: lines.length },
          ]}
          total={{ label: 'Total', value: formatRupiah(total) }}
        />
      </div>
    </div>
  )
}
