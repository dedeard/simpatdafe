import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { BUILDING_CLASSES, LAND_CLASSES, USE_LABEL, createPbbObject, type PbbUse } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { spptCalc } from '@/lib/tax'
import { formatRupiah } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormSection, NumberField, PageHeader, SelectField, SummaryCard, TextAreaField, TextField } from '../../../-components'
import { useAppData, useSubmit } from '../../../-hooks'
import { digitsOnly, toOptions } from '../../../-utils'

export const Route = createFileRoute('/_app/pbb/objek/create/')({
  head: () => ({ meta: [{ title: 'Daftarkan objek PBB | SIMPATDA Raja Ampat' }] }),
  component: CreatePbbObjectPage,
})

function CreatePbbObjectPage() {
  const navigate = useNavigate()
  const { regions, tariffs } = useAppData()
  const [ownerName, setOwnerName] = useState('')
  const [ownerNik, setOwnerNik] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [distrikId, setDistrikId] = useState('')
  const [kampungId, setKampungId] = useState('')
  const [objectAddress, setObjectAddress] = useState('')
  const [landArea, setLandArea] = useState<number | undefined>()
  const [buildingArea, setBuildingArea] = useState<number | undefined>(0)
  const [landClass, setLandClass] = useState('')
  const [buildingClass, setBuildingClass] = useState('')
  const [use, setUse] = useState<PbbUse | ''>('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  const land = LAND_CLASSES.find((c) => c.value === landClass)
  const building = BUILDING_CLASSES.find((c) => c.value === buildingClass)
  const njop = Math.round((landArea ?? 0) * (land?.perM2 ?? 0) + (buildingArea ?? 0) * (building?.perM2 ?? 0))
  const estimate = spptCalc(njop, true, tariffs, TODAY)
  const kampung = regions.find((r) => r.id === distrikId)?.kampung ?? []

  const submit = () =>
    run(async () => {
      const e: Record<string, string> = {}
      if (!ownerName.trim()) e.ownerName = 'Nama pemilik wajib diisi.'
      if (!/^\d{16}$/.test(ownerNik)) e.ownerNik = 'NIK harus 16 digit.'
      if (!ownerAddress.trim()) e.ownerAddress = 'Alamat pemilik wajib diisi.'
      if (!distrikId) e.distrik = 'Pilih distrik.'
      if (!kampungId) e.kampung = 'Pilih kampung.'
      if (!objectAddress.trim()) e.objectAddress = 'Alamat objek wajib diisi.'
      if (!landArea || landArea <= 0) e.landArea = 'Luas tanah harus lebih dari 0.'
      if (buildingArea === undefined || buildingArea < 0) e.buildingArea = 'Luas bangunan tidak boleh negatif.'
      if (!landClass) e.landClass = 'Pilih kelas tanah.'
      if ((buildingArea ?? 0) > 0 && !buildingClass) e.buildingClass = 'Pilih kelas bangunan.'
      if (!use) e.use = 'Pilih penggunaan.'
      setErrors(e)
      if (Object.keys(e).length > 0 || !landArea || !use) return
      const result = await createPbbObject({
        ownerName,
        ownerNik,
        ownerAddress,
        objectAddress,
        distrikId,
        kampungId,
        landArea,
        buildingArea: buildingArea ?? 0,
        landClass,
        buildingClass,
        use,
      })
      toast.success(`NOP ${result.nop} terdaftar.`)
      await navigate({ to: '/pbb/$nop', params: { nop: result.nop } })
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Daftarkan objek PBB-P2"
        description="Formulir SPOP: data pemilik, lokasi, dan nilai objek. NOP dibuat otomatis."
        back={{ to: '/pbb', label: 'Daftar objek' }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {error && <FormAlert>{error}</FormAlert>}
          <FormSection title="Pemilik">
            <TextField label="Nama pemilik" required value={ownerName} error={errors.ownerName} onChange={setOwnerName} />
            <TextField
              label="NIK"
              required
              inputMode="numeric"
              maxLength={16}
              value={ownerNik}
              error={errors.ownerNik}
              onChange={(v) => setOwnerNik(digitsOnly(v))}
            />
            <TextAreaField
              className="sm:col-span-2"
              label="Alamat pemilik"
              required
              rows={2}
              value={ownerAddress}
              error={errors.ownerAddress}
              onChange={setOwnerAddress}
            />
          </FormSection>
          <FormSection title="Lokasi objek">
            <SelectField
              label="Distrik"
              required
              value={distrikId}
              error={errors.distrik}
              onChange={(v) => {
                setDistrikId(v)
                setKampungId('')
              }}
              options={regions.map((r) => ({ value: r.id, label: r.name }))}
            />
            <SelectField
              label="Kampung"
              required
              value={kampungId}
              error={errors.kampung}
              disabled={!distrikId}
              onChange={setKampungId}
              options={kampung.map((k) => ({ value: k.id, label: k.name }))}
            />
            <TextAreaField
              className="sm:col-span-2"
              label="Alamat objek"
              required
              rows={2}
              value={objectAddress}
              error={errors.objectAddress}
              onChange={setObjectAddress}
            />
          </FormSection>
          <FormSection title="Nilai objek" description="NJOP = luas tanah × nilai per m² + luas bangunan × nilai per m².">
            <NumberField label="Luas tanah" suffix="m²" required min={1} value={landArea} error={errors.landArea} onChange={setLandArea} />
            <NumberField
              label="Luas bangunan"
              suffix="m²"
              min={0}
              value={buildingArea}
              error={errors.buildingArea}
              onChange={setBuildingArea}
            />
            <SelectField
              label="Kelas tanah (ZNT)"
              required
              value={landClass}
              error={errors.landClass}
              onChange={setLandClass}
              options={LAND_CLASSES.map((c) => ({ value: c.value, label: `${c.label} · ${formatRupiah(c.perM2)}/m²` }))}
            />
            <SelectField
              label="Kelas bangunan"
              value={buildingClass}
              error={errors.buildingClass}
              onChange={setBuildingClass}
              options={BUILDING_CLASSES.map((c) => ({ value: c.value, label: `${c.label} · ${formatRupiah(c.perM2)}/m²` }))}
            />
            <SelectField
              className="sm:col-span-2"
              label="Penggunaan"
              required
              value={use}
              error={errors.use}
              onChange={(v) => setUse(v as PbbUse)}
              options={toOptions(USE_LABEL)}
            />
          </FormSection>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2Icon className="animate-spin" />}
              Daftarkan objek
            </Button>
          </div>
        </div>
        <SummaryCard
          title="Perkiraan PBB"
          rows={[
            { label: 'NJOP tanah', value: formatRupiah(Math.round((landArea ?? 0) * (land?.perM2 ?? 0))) },
            { label: 'NJOP bangunan', value: formatRupiah(Math.round((buildingArea ?? 0) * (building?.perM2 ?? 0))) },
            { label: 'NJOP total', value: formatRupiah(njop) },
            { label: 'NJOPTKP', value: formatRupiah(estimate.njoptkp) },
            { label: 'NJKP', value: formatRupiah(estimate.njkp) },
            { label: 'Tarif', value: `${estimate.rate}%` },
          ]}
          total={{ label: 'PBB-P2 per tahun', value: formatRupiah(estimate.amount) }}
          footer="NJOPTKP hanya berlaku satu kali per pemilik. Ini perkiraan, SPPT dihitung saat penetapan massal."
        />
      </div>
    </div>
  )
}
