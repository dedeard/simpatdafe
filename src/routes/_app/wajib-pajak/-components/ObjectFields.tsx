import { CODE, TAX_TYPES, TAX_TYPE_BY_CODE, type Distrik, type ObjectInput } from '@/lib/api/resources'
import { TODAY } from '@/lib/dates'
import { DateField, FormSection, MoneyField, NumberField, SelectField, TextField } from '../../-components'
import type { Errors } from './IdentityFields'

export type ObjectValues = {
  taxCode: string
  name: string
  category: string
  capacity: number | undefined
  averageRate: number | undefined
  startedAt: string
  latitude: number | undefined
  longitude: number | undefined
}

export const EMPTY_OBJECT: ObjectValues = {
  taxCode: '',
  name: '',
  category: '',
  capacity: undefined,
  averageRate: undefined,
  startedAt: '',
  latitude: undefined,
  longitude: undefined,
}

export function validateObject(v: ObjectValues): Errors {
  const e: Errors = {}
  if (!v.taxCode) e.taxCode = 'Pilih jenis pajak.'
  if (!v.name.trim()) e.name = 'Nama objek wajib diisi.'
  if (!v.category) e.category = 'Pilih kategori.'
  if ((v.taxCode === CODE.hotel || v.taxCode === CODE.restaurant) && (!v.capacity || v.capacity <= 0)) {
    e.capacity = v.taxCode === CODE.hotel ? 'Jumlah kamar wajib diisi.' : 'Jumlah kursi wajib diisi.'
  }
  if (!v.startedAt) e.startedAt = 'Tanggal mulai wajib diisi.'
  else if (v.startedAt > TODAY) e.startedAt = 'Tidak boleh di masa depan.'
  if (v.latitude !== undefined && (v.latitude < -2.5 || v.latitude > 0.5)) e.latitude = 'Lintang harus antara −2,5 dan 0,5.'
  if (v.longitude !== undefined && (v.longitude < 129.5 || v.longitude > 131.5)) e.longitude = 'Bujur harus antara 129,5 dan 131,5.'
  return e
}

export function toObjectInput(v: ObjectValues, place?: { distrikId: string; kampungId: string }): ObjectInput {
  return {
    taxCode: v.taxCode,
    name: v.name.trim(),
    category: v.category,
    capacity: v.capacity,
    averageRate: v.averageRate,
    startedAt: v.startedAt,
    latitude: v.latitude,
    longitude: v.longitude,
    ...place,
  }
}

type Props = {
  values: ObjectValues
  errors: Errors
  onChange: (patch: Partial<ObjectValues>) => void
  title?: string
  regions?: Array<Distrik>
}

export function ObjectFields({ values, errors, onChange, title = 'Objek pajak pertama' }: Props) {
  const type = TAX_TYPE_BY_CODE[values.taxCode]
  const capacityLabel = values.taxCode === CODE.hotel ? 'Jumlah kamar' : values.taxCode === CODE.restaurant ? 'Jumlah kursi' : 'Kapasitas'
  return (
    <FormSection title={title} description="Usaha atau titik objek yang dikenai pajak daerah.">
      <SelectField
        label="Jenis pajak"
        required
        value={values.taxCode}
        error={errors.taxCode}
        onChange={(taxCode) => onChange({ taxCode, category: '' })}
        options={TAX_TYPES.map((t) => ({ value: t.code, label: t.name }))}
      />
      <SelectField
        label="Kategori"
        required
        value={values.category}
        error={errors.category}
        disabled={!type}
        onChange={(category) => onChange({ category })}
        options={(type?.categories ?? []).map((c) => ({ value: c, label: c }))}
      />
      <TextField
        label="Nama objek"
        required
        className="sm:col-span-2"
        value={values.name}
        error={errors.name}
        onChange={(name) => onChange({ name })}
      />
      <NumberField
        label={capacityLabel}
        required={values.taxCode === CODE.hotel || values.taxCode === CODE.restaurant}
        value={values.capacity}
        error={errors.capacity}
        min={1}
        onChange={(capacity) => onChange({ capacity })}
      />
      <MoneyField
        label="Tarif rata-rata"
        hint="Tarif kamar per malam atau rata-rata nota (opsional)."
        value={values.averageRate}
        onChange={(averageRate) => onChange({ averageRate })}
      />
      <DateField
        label="Mulai beroperasi"
        required
        value={values.startedAt}
        error={errors.startedAt}
        max={TODAY}
        onChange={(startedAt) => onChange({ startedAt })}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Lintang"
          step="0.00001"
          value={values.latitude}
          error={errors.latitude}
          placeholder="-0.4290"
          onChange={(latitude) => onChange({ latitude })}
        />
        <NumberField
          label="Bujur"
          step="0.00001"
          value={values.longitude}
          error={errors.longitude}
          placeholder="130.8330"
          onChange={(longitude) => onChange({ longitude })}
        />
      </div>
    </FormSection>
  )
}
