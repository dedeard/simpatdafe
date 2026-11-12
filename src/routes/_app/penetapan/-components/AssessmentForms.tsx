import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { CODE, createAssessment, listVerifiedSptpd, type AssessmentInput } from '@/lib/api/resources'
import { addDays, monthLabel, monthsLate, TODAY } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { airTanahCalc, interestFor, REKLAME_CLASSES, REKLAME_TYPES, reklameCalc, taxDue } from '@/lib/tax'
import { formatDate, formatRupiah } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTaxpayerObjects } from '../-hooks/use-taxpayer-objects'
import { DateField, FormSection, MoneyField, NumberField, SelectField, SummaryCard, TaxpayerPicker, TextAreaField } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'

type Errors = Record<string, string | undefined>

function useCreate() {
  const navigate = useNavigate()
  const { pending, error, run } = useSubmit()
  const submit = (input: AssessmentInput, validate: () => Errors, setErrors: (e: Errors) => void) =>
    run(async () => {
      const found = validate()
      setErrors(found)
      if (Object.keys(found).length > 0) return
      const result = await createAssessment(input)
      toast.success(input.issue ? 'Ketetapan diterbitkan.' : 'Draf ketetapan disimpan.')
      await navigate({ to: '/penetapan/$id', params: { id: toSlug(result.id) } })
    })
  return { pending, error, submit }
}

function Actions({ pending, onDraft, onIssue }: { pending: boolean; onDraft: () => void; onIssue: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" disabled={pending} onClick={onDraft}>
        Simpan draf
      </Button>
      <Button disabled={pending} onClick={onIssue}>
        {pending && <Loader2Icon className="animate-spin" />}
        Terbitkan
      </Button>
    </div>
  )
}

export function ReklameForm() {
  const { tariffs } = useAppData()
  const { taxpayer, objects, objectId, setObjectId, pick } = useTaxpayerObjects([CODE.reklame])
  const [type, setType] = useState('papan')
  const [width, setWidth] = useState<number | undefined>()
  const [height, setHeight] = useState<number | undefined>()
  const [sides, setSides] = useState<number | undefined>(1)
  const [roadClass, setRoadClass] = useState('utama')
  const [start, setStart] = useState('')
  const [months, setMonths] = useState<number | undefined>(12)
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, submit } = useCreate()

  const calc = reklameCalc(
    { type, width: width ?? 0, height: height ?? 0, sides: sides ?? 0, roadClass, months: months ?? 0 },
    tariffs,
    TODAY,
  )

  const validate = (): Errors => {
    const e: Errors = {}
    if (!taxpayer) e.taxpayer = 'Pilih wajib pajak.'
    if (!objectId) e.object = 'Pilih objek reklame.'
    if (!width || !height || width <= 0 || height <= 0) e.size = 'Panjang dan lebar harus lebih dari 0.'
    else if (width * height > 100) e.size = 'Luas maksimal 100 m².'
    if (!sides || sides < 1 || sides > 4) e.sides = 'Jumlah sisi 1–4.'
    if (!start) e.start = 'Tanggal mulai wajib diisi.'
    if (!months || months < 1 || months > 12) e.months = 'Masa pasang 1–12 bulan.'
    return e
  }

  const send = (issue: boolean) =>
    submit(
      {
        kind: 'reklame',
        taxpayerId: taxpayer?.id ?? '',
        objectId,
        reklame: { type, width: width ?? 0, height: height ?? 0, sides: sides ?? 0, roadClass, start, months: months ?? 0 },
        issue,
      },
      validate,
      setErrors,
    )

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <FormSection title="Objek reklame">
          <div className="sm:col-span-2">
            <TaxpayerPicker required value={taxpayer} error={errors.taxpayer} onChange={pick} />
          </div>
          <SelectField
            className="sm:col-span-2"
            label="Objek pajak reklame"
            required
            value={objectId}
            error={errors.object}
            disabled={!taxpayer}
            hint={taxpayer && objects.length === 0 ? 'WP ini tidak memiliki objek reklame aktif.' : undefined}
            onChange={setObjectId}
            options={objects.map((o) => ({ value: o.id, label: `${o.name} · ${o.address}` }))}
          />
        </FormSection>
        <FormSection title="Data reklame" description="Nilai sewa reklame dihitung dari luas, jumlah sisi, kelas jalan, dan masa pasang.">
          <SelectField label="Jenis reklame" required value={type} onChange={setType} options={[...REKLAME_TYPES]} />
          <SelectField label="Kelas jalan" required value={roadClass} onChange={setRoadClass} options={[...REKLAME_CLASSES]} />
          <NumberField label="Panjang" suffix="m" step="0.1" min={0} value={width} error={errors.size} onChange={setWidth} />
          <NumberField label="Lebar" suffix="m" step="0.1" min={0} value={height} onChange={setHeight} />
          <NumberField label="Jumlah sisi" min={1} max={4} value={sides} error={errors.sides} onChange={setSides} />
          <NumberField label="Masa pasang" suffix="bulan" min={1} max={12} value={months} error={errors.months} onChange={setMonths} />
          <DateField label="Mulai pasang" required value={start} error={errors.start} onChange={setStart} />
        </FormSection>
        <Actions pending={pending} onDraft={() => send(false)} onIssue={() => send(true)} />
      </div>
      <SummaryCard
        title="Perhitungan"
        rows={[
          { label: 'Luas', value: `${calc.area.toLocaleString('id-ID')} m²` },
          { label: 'Nilai sewa reklame (NSR)', value: formatRupiah(calc.nsr) },
          { label: 'Tarif', value: `${calc.rate}%` },
          { label: 'Jatuh tempo', value: formatDate(addDays(TODAY, 30)) },
        ]}
        total={{ label: 'Pajak reklame', value: formatRupiah(calc.tax) }}
        footer="Ketetapan yang sudah terbit tidak dapat diubah."
      />
    </div>
  )
}

export function AirTanahForm() {
  const { tariffs } = useAppData()
  const { taxpayer, objects, objectId, setObjectId, pick } = useTaxpayerObjects([CODE.airTanah])
  const [period, setPeriod] = useState('')
  const [meterStart, setMeterStart] = useState<number | undefined>()
  const [meterEnd, setMeterEnd] = useState<number | undefined>()
  const [use, setUse] = useState('niaga')
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, submit } = useCreate()

  const calc = airTanahCalc({ meterStart: meterStart ?? 0, meterEnd: meterEnd ?? 0, use }, tariffs, TODAY)

  const validate = (): Errors => {
    const e: Errors = {}
    if (!taxpayer) e.taxpayer = 'Pilih wajib pajak.'
    if (!objectId) e.object = 'Pilih objek sumur.'
    if (!period) e.period = 'Pilih masa pajak.'
    if (meterStart === undefined) e.start = 'Meter awal wajib diisi.'
    if (meterEnd === undefined || (meterStart !== undefined && meterEnd <= meterStart))
      e.end = 'Meter akhir harus lebih besar dari meter awal.'
    return e
  }

  const send = (issue: boolean) =>
    submit(
      {
        kind: 'airtanah',
        taxpayerId: taxpayer?.id ?? '',
        objectId,
        airTanah: { meterStart: meterStart ?? 0, meterEnd: meterEnd ?? 0, use, period },
        issue,
      },
      validate,
      setErrors,
    )

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <FormSection title="Objek air tanah">
          <div className="sm:col-span-2">
            <TaxpayerPicker required value={taxpayer} error={errors.taxpayer} onChange={pick} />
          </div>
          <SelectField
            className="sm:col-span-2"
            label="Sumur / objek air tanah"
            required
            value={objectId}
            error={errors.object}
            disabled={!taxpayer}
            hint={taxpayer && objects.length === 0 ? 'WP ini tidak memiliki objek air tanah aktif.' : undefined}
            onChange={setObjectId}
            options={objects.map((o) => ({ value: o.id, label: o.name }))}
          />
        </FormSection>
        <FormSection title="Pencatatan meter">
          <DateField label="Masa pajak" type="month" required value={period} error={errors.period} onChange={setPeriod} />
          <SelectField
            label="Peruntukan"
            required
            value={use}
            onChange={setUse}
            options={[
              { value: 'niaga', label: 'Niaga' },
              { value: 'industri', label: 'Industri' },
            ]}
          />
          <NumberField label="Meter awal" suffix="m³" min={0} value={meterStart} error={errors.start} onChange={setMeterStart} />
          <NumberField label="Meter akhir" suffix="m³" min={0} value={meterEnd} error={errors.end} onChange={setMeterEnd} />
        </FormSection>
        <Actions pending={pending} onDraft={() => send(false)} onIssue={() => send(true)} />
      </div>
      <SummaryCard
        title="Perhitungan"
        rows={[
          { label: 'Volume', value: `${calc.volume.toLocaleString('id-ID')} m³` },
          { label: 'NPA per m³', value: formatRupiah(calc.npaPerM3) },
          { label: 'Nilai perolehan air (NPA)', value: formatRupiah(calc.npa) },
          { label: 'Tarif', value: `${calc.rate}%` },
        ]}
        total={{ label: 'Pajak air tanah', value: formatRupiah(calc.tax) }}
      />
    </div>
  )
}

type VerifiedSptpd = Awaited<ReturnType<typeof listVerifiedSptpd>>[number]

export function SkpdkbForm() {
  const { tariffs } = useAppData()
  const { taxpayer, pick } = useTaxpayerObjects([])
  const [returns, setReturns] = useState<Array<VerifiedSptpd>>([])
  const [sptpdId, setSptpdId] = useState('')
  const [corrected, setCorrected] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, submit } = useCreate()

  const source = returns.find((r) => r.id === sptpdId)
  const gross = source?.grossAmount ?? 0
  const principal = source && corrected && corrected > gross ? taxDue(corrected - gross, source.rate) : 0
  const months = source ? monthsLate(source.dueDate, TODAY) : 0
  const penalty = interestFor(principal, months, tariffs, TODAY)

  const pickTaxpayer = async (t: Parameters<typeof pick>[0]) => {
    await pick(t)
    setSptpdId('')
    setReturns(await listVerifiedSptpd(t.id))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!taxpayer) e.taxpayer = 'Pilih wajib pajak.'
    if (!sptpdId) e.sptpd = 'Pilih SPTPD yang diperiksa.'
    if (!corrected || corrected <= gross) e.corrected = 'Omzet koreksi harus lebih besar dari omzet dilaporkan.'
    if (!notes.trim()) e.notes = 'Catatan pemeriksaan wajib diisi.'
    return e
  }

  const send = (issue: boolean) =>
    submit({ kind: 'skpdkb', taxpayerId: taxpayer?.id ?? '', sptpdId, correctedGross: corrected ?? 0, notes, issue }, validate, setErrors)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <FormSection
          title="SPTPD yang diperiksa"
          description="SKPDKB diterbitkan bila hasil pemeriksaan menunjukkan omzet lebih besar dari yang dilaporkan."
        >
          <div className="sm:col-span-2">
            <TaxpayerPicker required value={taxpayer} error={errors.taxpayer} onChange={pickTaxpayer} />
          </div>
          <SelectField
            className="sm:col-span-2"
            label="SPTPD terverifikasi"
            required
            value={sptpdId}
            error={errors.sptpd}
            disabled={!taxpayer}
            hint={taxpayer && returns.length === 0 ? 'Belum ada SPTPD terverifikasi untuk WP ini.' : undefined}
            onChange={setSptpdId}
            options={returns.map((r) => ({
              value: r.id,
              label: `${monthLabel(r.period)} · ${r.objectName} · omzet ${formatRupiah(r.grossAmount)}`,
            }))}
          />
        </FormSection>
        <FormSection title="Hasil pemeriksaan">
          <ReadOnly label="Omzet dilaporkan" value={source ? formatRupiah(source.grossAmount) : '-'} />
          <MoneyField label="Omzet hasil pemeriksaan" required value={corrected} error={errors.corrected} onChange={setCorrected} />
          <TextAreaField
            className="sm:col-span-2"
            label="Catatan pemeriksaan"
            required
            value={notes}
            error={errors.notes}
            onChange={setNotes}
            placeholder="mis. Buku tamu dan nota kasir menunjukkan hunian lebih tinggi dari SPTPD."
          />
        </FormSection>
        <Actions pending={pending} onDraft={() => send(false)} onIssue={() => send(true)} />
      </div>
      <SummaryCard
        title="Perhitungan"
        rows={[
          { label: 'Selisih omzet', value: formatRupiah(Math.max((corrected ?? 0) - gross, 0)) },
          { label: 'Tarif', value: `${source?.rate ?? 0}%` },
          { label: 'Pokok kurang bayar', value: formatRupiah(principal) },
          { label: `Bunga (${months} bulan)`, value: formatRupiah(penalty) },
        ]}
        total={{ label: 'Total SKPDKB', value: formatRupiah(principal + penalty) }}
        footer="Bunga dihitung dari jatuh tempo SPTPD asal, maksimal 24 bulan."
      />
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-snug font-medium">{label}</span>
      <div className="flex min-h-8 items-center rounded-lg border border-dashed bg-muted/40 px-2.5 text-sm tabular-nums">{value}</div>
    </div>
  )
}
