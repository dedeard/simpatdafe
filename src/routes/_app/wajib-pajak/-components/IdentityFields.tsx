import type { Distrik, TaxpayerType } from '@/lib/api/resources'
import { FormSection, SelectField, TextAreaField, TextField } from '../../-components'
import { digitsOnly } from '../../-utils'

export type Errors = Record<string, string | undefined>

export type IdentityValues = {
  type: TaxpayerType
  name: string
  ownerName: string
  nik: string
  npwp: string
  phone: string
  email: string
  distrikId: string
  kampungId: string
  address: string
}

export const EMPTY_IDENTITY: IdentityValues = {
  type: 'pribadi',
  name: '',
  ownerName: '',
  nik: '',
  npwp: '',
  phone: '',
  email: '',
  distrikId: '',
  kampungId: '',
  address: '',
}

export function validateIdentity(v: IdentityValues): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 3) e.name = 'Nama minimal 3 karakter.'
  if (v.name.trim().length > 120) e.name = 'Nama maksimal 120 karakter.'
  if (!v.ownerName.trim()) e.ownerName = 'Nama pemilik wajib diisi.'
  if (v.type === 'pribadi' && !/^\d{16}$/.test(v.nik)) e.nik = 'NIK harus 16 digit.'
  if (v.type === 'badan' && !/^\d{16}$/.test(v.npwp)) e.npwp = 'NPWP harus 16 digit.'
  if (!/^(08|\+62)\d{8,12}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Nomor telepon harus diawali 08 atau +62 (10–14 digit).'
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Format email tidak valid.'
  return e
}

export function validateAddress(v: IdentityValues): Errors {
  const e: Errors = {}
  if (!v.distrikId) e.distrikId = 'Pilih distrik.'
  if (!v.kampungId) e.kampungId = 'Pilih kampung.'
  if (!v.address.trim()) e.address = 'Alamat wajib diisi.'
  return e
}

type Props = {
  values: IdentityValues
  errors: Errors
  onChange: (patch: Partial<IdentityValues>) => void
  regions: Array<Distrik>
  lockType?: boolean
}

export function IdentityFields({ values, errors, onChange, lockType }: Omit<Props, 'regions'>) {
  return (
    <FormSection title="Identitas wajib pajak" description="Data sesuai KTP / akta pendirian dan NPWP.">
      <SelectField
        label="Jenis WP"
        required
        value={values.type}
        disabled={lockType}
        onChange={(v) => onChange({ type: v as TaxpayerType })}
        options={[
          { value: 'pribadi', label: 'Pribadi' },
          { value: 'badan', label: 'Badan (PT / CV / koperasi)' },
        ]}
      />
      <TextField
        label={values.type === 'badan' ? 'Nama usaha' : 'Nama WP / nama usaha'}
        required
        value={values.name}
        error={errors.name}
        onChange={(name) => onChange({ name })}
        placeholder="mis. Homestay Arborek Lestari"
      />
      <TextField
        label="Nama pemilik / penanggung jawab"
        required
        value={values.ownerName}
        error={errors.ownerName}
        onChange={(ownerName) => onChange({ ownerName })}
      />
      {values.type === 'pribadi' ? (
        <TextField
          label="NIK"
          required
          inputMode="numeric"
          maxLength={16}
          value={values.nik}
          error={errors.nik}
          hint="16 digit"
          onChange={(v) => onChange({ nik: digitsOnly(v) })}
        />
      ) : (
        <TextField
          label="NPWP"
          required
          inputMode="numeric"
          maxLength={16}
          value={values.npwp}
          error={errors.npwp}
          hint="16 digit"
          onChange={(v) => onChange({ npwp: digitsOnly(v) })}
        />
      )}
      <TextField
        label="Telepon"
        required
        inputMode="tel"
        value={values.phone}
        error={errors.phone}
        placeholder="0812xxxxxxxx"
        onChange={(phone) => onChange({ phone })}
      />
      <TextField label="Email" type="email" value={values.email} error={errors.email} onChange={(email) => onChange({ email })} />
    </FormSection>
  )
}

export function AddressFields({ values, errors, onChange, regions }: Props) {
  const kampung = regions.find((r) => r.id === values.distrikId)?.kampung ?? []
  return (
    <FormSection title="Alamat" description="Lokasi alamat korespondensi wajib pajak.">
      <SelectField
        label="Distrik"
        required
        value={values.distrikId}
        error={errors.distrikId}
        onChange={(distrikId) => onChange({ distrikId, kampungId: '' })}
        options={regions.map((r) => ({ value: r.id, label: r.name }))}
      />
      <SelectField
        label="Kampung"
        required
        value={values.kampungId}
        error={errors.kampungId}
        disabled={!values.distrikId}
        onChange={(kampungId) => onChange({ kampungId })}
        options={kampung.map((k) => ({ value: k.id, label: k.name }))}
      />
      <TextAreaField
        className="sm:col-span-2"
        label="Alamat lengkap"
        required
        value={values.address}
        error={errors.address}
        onChange={(address) => onChange({ address })}
      />
    </FormSection>
  )
}
