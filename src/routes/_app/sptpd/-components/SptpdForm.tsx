import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSptpd, getTaxpayer, SPTPD_LINE_PRESETS, type TaxObjectRow, type TaxpayerPick } from '@/lib/api/resources'
import { monthLabel } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { sptpdDueDate, tariffValue, taxDue } from '@/lib/tax'
import { formatDate, formatRupiah } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  DateField,
  FormSection,
  MoneyField,
  NumberField,
  SelectField,
  SummaryCard,
  TaxpayerPicker,
  TextAreaField,
  TextField,
} from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'

type Line = { description: string; quantity: number | undefined; unitPrice: number | undefined }

export type SptpdInitial = { taxpayer: TaxpayerPick; objects: Array<TaxObjectRow>; objectId?: string; period?: string }

const SELF = ['4.1.01.12', '4.1.01.11', '4.1.01.15', '4.1.01.14', '4.1.01.13', '4.1.01.20', '4.1.01.18']

export function SptpdForm({ initial }: { initial?: SptpdInitial }) {
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [taxpayer, setTaxpayer] = useState<TaxpayerPick | null>(initial?.taxpayer ?? null)
  const [objects, setObjects] = useState<Array<TaxObjectRow>>(initial?.objects ?? [])
  const [objectId, setObjectId] = useState(initial?.objectId ?? '')
  const [period, setPeriod] = useState(initial?.period ?? '')
  const [lines, setLines] = useState<Array<Line>>([{ description: '', quantity: undefined, unitPrice: undefined }])
  const [attachments, setAttachments] = useState<Array<string>>([])
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const object = objects.find((o) => o.id === objectId)
  const rate = object ? tariffValue(tariffs, `rate.${object.taxCode}`) : 0
  const gross = lines.reduce((s, l) => s + Math.round((l.quantity ?? 0) * (l.unitPrice ?? 0)), 0)
  const tax = taxDue(gross, rate)

  const pickTaxpayer = async (t: TaxpayerPick) => {
    setTaxpayer(t)
    setObjectId('')
    const detail = await getTaxpayer(t.id)
    setObjects(detail.objects.filter((o) => o.status === 'active' && SELF.includes(o.taxCode)))
  }

  const updateLine = (index: number, patch: Partial<Line>) => setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  const fillPreset = () => {
    const presets = object ? (SPTPD_LINE_PRESETS[object.taxCode] ?? []) : []
    if (presets.length > 0) setLines(presets.map((description) => ({ description, quantity: undefined, unitPrice: undefined })))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!taxpayer) e.taxpayer = 'Pilih wajib pajak.'
    if (!objectId) e.object = 'Pilih objek pajak.'
    if (!period) e.period = 'Pilih masa pajak.'
    else if (period >= '2026-11') e.period = 'Masa pajak harus sebelum bulan berjalan.'
    if (!lines.some((l) => (l.quantity ?? 0) > 0 && l.description.trim()))
      e.lines = 'Isi minimal satu baris rincian omzet (uraian dan jumlah).'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (send: boolean) =>
    run(async () => {
      if (!validate() || !taxpayer) return
      const result = await createSptpd({
        taxpayerId: taxpayer.id,
        objectId,
        period,
        lines: lines
          .filter((l) => (l.quantity ?? 0) > 0 && l.description.trim())
          .map((l) => ({ description: l.description, quantity: l.quantity ?? 0, unitPrice: l.unitPrice ?? 0 })),
        attachments,
        note: note.trim() || undefined,
        submit: send,
      })
      toast.success(send ? 'SPTPD dilaporkan.' : 'Draf SPTPD disimpan.')
      await navigate({ to: '/sptpd/$id', params: { id: toSlug(result.id) } })
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <FormSection title="Wajib pajak dan masa pajak" description="SPTPD dibuat per objek pajak per masa pajak (satu bulan).">
          <div className="sm:col-span-2">
            <TaxpayerPicker required value={taxpayer} error={errors.taxpayer} onChange={pickTaxpayer} />
          </div>
          <SelectField
            label="Objek pajak"
            required
            value={objectId}
            error={errors.object}
            disabled={!taxpayer}
            hint={taxpayer && objects.length === 0 ? 'WP ini tidak memiliki objek self assessment aktif.' : undefined}
            onChange={setObjectId}
            options={objects.map((o) => ({ value: o.id, label: `${o.name} · ${o.taxName}` }))}
          />
          <DateField label="Masa pajak" type="month" required value={period} max="2026-10" error={errors.period} onChange={setPeriod} />
        </FormSection>

        <FormSection title="Rincian omzet" description="Dasar pengenaan pajak. Jumlah × harga satuan dihitung otomatis.">
          <div className="flex flex-col gap-3 sm:col-span-2">
            {errors.lines && <FormAlert>{errors.lines}</FormAlert>}
            {lines.map((line, i) => (
              <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_7rem_10rem_auto] sm:items-end">
                <TextField label="Uraian" value={line.description} onChange={(description) => updateLine(i, { description })} />
                <NumberField label="Jumlah" min={0} value={line.quantity} onChange={(quantity) => updateLine(i, { quantity })} />
                <MoneyField label="Harga satuan" value={line.unitPrice} onChange={(unitPrice) => updateLine(i, { unitPrice })} />
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines([...lines, { description: '', quantity: undefined, unitPrice: undefined }])}
              >
                <PlusIcon />
                Tambah baris
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={fillPreset} disabled={!object}>
                <SparklesIcon />
                Isi contoh uraian
              </Button>
            </div>
          </div>
        </FormSection>

        <FormSection title="Lampiran dan catatan">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lampiran (nama berkas saja)</span>
            <Input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files ?? []).map((f) => f.name))} />
            {attachments.length > 0 && <span className="text-xs text-muted-foreground">{attachments.join(', ')}</span>}
          </div>
          <TextAreaField label="Catatan" value={note} onChange={setNote} />
        </FormSection>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={pending} onClick={() => submit(false)}>
            Simpan draf
          </Button>
          <Button disabled={pending} onClick={() => submit(true)}>
            {pending && <Loader2Icon className="animate-spin" />}
            Laporkan
          </Button>
        </div>
      </div>

      <SummaryCard
        title="Perhitungan"
        rows={[
          { label: 'Masa pajak', value: period ? monthLabel(period) : '-' },
          { label: 'Omzet total', value: formatRupiah(gross) },
          { label: 'Tarif', value: `${rate}%` },
          { label: 'Jatuh tempo', value: period ? formatDate(sptpdDueDate(period)) : '-' },
        ]}
        total={{ label: 'Pajak terutang', value: formatRupiah(tax) }}
        footer="Server menghitung ulang nilai ini saat disimpan."
      />
    </div>
  )
}
