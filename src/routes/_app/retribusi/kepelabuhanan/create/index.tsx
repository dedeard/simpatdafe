import { FormAlert } from '@/components/form-alert'
import { OptionSelect } from '@/components/select'
import { Button } from '@/components/ui/button'
import {
  PORT_LABEL,
  SERVICE_META,
  createPaymentCode,
  createPortBill,
  listVessels,
  type PortId,
  type PortService,
  type VesselRow,
} from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { toSlug } from '@/lib/slug'
import { tariffValue } from '@/lib/tax'
import { formatNumber, formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { VesselDialog } from '../-components/VesselDialog'
import { DateField, FormSection, NumberField, PageHeader, SelectField, SummaryCard } from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'
import { toOptions } from '../../../-utils'

export const Route = createFileRoute('/_app/retribusi/kepelabuhanan/create/')({
  head: () => ({ meta: [{ title: 'Buat tagihan pelabuhan | SIMPATDA Raja Ampat' }] }),
  loader: async () => (await listVessels({ pageSize: 100 })).rows,
  component: CreatePortBillPage,
})

type Item = { service: PortService | ''; quantity: number | undefined }

function CreatePortBillPage() {
  const initialVessels = Route.useLoaderData()
  const navigate = useNavigate()
  const { tariffs } = useAppData()
  const [vessels, setVessels] = useState<Array<VesselRow | { id: string; name: string }>>(initialVessels)
  const [port, setPort] = useState<PortId>('waisai')
  const [vesselId, setVesselId] = useState('')
  const [serviceDate, setServiceDate] = useState(TODAY)
  const [items, setItems] = useState<Array<Item>>([{ service: 'pas_penumpang', quantity: undefined }])
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const priced = items.map((i) => {
    const unitPrice = i.service ? tariffValue(tariffs, `port.${i.service}`, serviceDate) : 0
    return { ...i, unitPrice, amount: Math.round((i.quantity ?? 0) * unitPrice) }
  })
  const total = priced.reduce((s, i) => s + i.amount, 0)
  const vessel = initialVessels.find((v) => v.id === vesselId)

  const submit = (createCode: boolean) =>
    run(async () => {
      const e: Record<string, string> = {}
      const valid = priced.filter((i) => i.service && (i.quantity ?? 0) > 0)
      if (valid.length === 0) e.items = 'Isi minimal satu layanan dengan jumlah lebih dari 0.'
      if (valid.some((i) => i.service !== 'pas_penumpang') && !vesselId) e.vessel = 'Pilih kapal untuk layanan selain pas penumpang.'
      if (!serviceDate || serviceDate > TODAY) e.date = 'Tanggal layanan tidak valid.'
      setErrors(e)
      if (Object.keys(e).length > 0) return
      const created = await createPortBill({
        port,
        vesselId: vesselId || undefined,
        serviceDate,
        items: valid.map((i) => ({ service: i.service as PortService, quantity: i.quantity ?? 0 })),
      })
      toast.success('Tagihan pelabuhan dibuat.')
      if (createCode) {
        const code = await createPaymentCode({ kind: 'port', id: created.id })
        await navigate({ to: '/pembayaran/$id', params: { id: toSlug(code.id) } })
      } else {
        await navigate({ to: '/retribusi/kepelabuhanan/$id', params: { id: toSlug(created.id) } })
      }
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Buat tagihan pelabuhan"
        description="Hitung retribusi pas penumpang, tambat, labuh, bongkar muat, atau parkir."
        back={{ to: '/retribusi/kepelabuhanan', label: 'Kepelabuhanan' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          {errors.items && <FormAlert>{errors.items}</FormAlert>}
          <FormSection title="Pelabuhan dan kapal">
            <SelectField label="Pelabuhan" required value={port} onChange={(v) => setPort(v as PortId)} options={toOptions(PORT_LABEL)} />
            <DateField label="Tanggal layanan" required value={serviceDate} max={TODAY} error={errors.date} onChange={setServiceDate} />
            <div className="flex flex-col gap-2 sm:col-span-2">
              <SelectField
                label="Kapal"
                value={vesselId}
                error={errors.vessel}
                onChange={setVesselId}
                options={vessels.map((v) => ({ value: v.id, label: v.name }))}
                placeholder="Tanpa kapal (pas penumpang umum)"
              />
              <div>
                <VesselDialog
                  onCreated={(created) => {
                    setVessels([...vessels, created])
                    setVesselId(created.id)
                  }}
                />
              </div>
            </div>
          </FormSection>
          <FormSection title="Layanan" description="Tarif mengikuti Perbup dan dapat diubah di Pengaturan.">
            <div className="flex flex-col gap-3 sm:col-span-2">
              {priced.map((item, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Layanan</span>
                    <OptionSelect
                      aria-label="Layanan"
                      clearable={false}
                      value={item.service}
                      onChange={(value) => setItems(items.map((x, k) => (k === i ? { ...x, service: value as PortService } : x)))}
                      options={toOptions(Object.fromEntries(Object.entries(SERVICE_META).map(([k, v]) => [k, v.label])))}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.service ? `${formatRupiah(item.unitPrice)} per ${SERVICE_META[item.service].unit}` : ''}
                      {item.service === 'tambat' && vessel ? ` · GT ${formatNumber(vessel.grossTonnage)}` : ''}
                    </span>
                  </div>
                  <NumberField
                    label={item.service ? SERVICE_META[item.service].unit : 'Jumlah'}
                    min={0}
                    value={item.quantity}
                    onChange={(quantity) => setItems(items.map((x, k) => (k === i ? { ...x, quantity } : x)))}
                  />
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-right tabular-nums">{formatRupiah(item.amount)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus layanan"
                      disabled={items.length === 1}
                      onClick={() => setItems(items.filter((_, k) => k !== i))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems([...items, { service: 'labuh', quantity: vessel?.grossTonnage }])}
                >
                  <PlusIcon />
                  Tambah layanan
                </Button>
              </div>
            </div>
          </FormSection>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={pending} onClick={() => submit(false)}>
              Simpan
            </Button>
            <Button disabled={pending} onClick={() => submit(true)}>
              {pending && <Loader2Icon className="animate-spin" />}
              Simpan dan buat kode bayar
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Total tagihan"
          rows={priced
            .filter((i) => i.service)
            .map((i) => ({ label: i.service ? SERVICE_META[i.service as PortService].label : '', value: formatRupiah(i.amount) }))}
          total={{ label: 'Total', value: formatRupiah(total) }}
        />
      </div>
    </div>
  )
}
