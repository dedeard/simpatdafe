import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { createTaxpayer, distrikName, kampungName, revenueName } from '@/lib/api/resources'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { CheckIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { SummaryCard } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'
import {
  AddressFields,
  EMPTY_IDENTITY,
  IdentityFields,
  validateAddress,
  validateIdentity,
  type Errors,
  type IdentityValues,
} from './IdentityFields'
import { EMPTY_OBJECT, ObjectFields, toObjectInput, validateObject, type ObjectValues } from './ObjectFields'

const STEPS = ['Identitas', 'Alamat', 'Objek pajak']

export function CreateTaxpayerForm() {
  const navigate = useNavigate()
  const { regions } = useAppData()
  const [step, setStep] = useState(0)
  const [identity, setIdentity] = useState<IdentityValues>(EMPTY_IDENTITY)
  const [object, setObject] = useState<ObjectValues>(EMPTY_OBJECT)
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, run } = useSubmit()

  const validators = [() => validateIdentity(identity), () => validateAddress(identity), () => validateObject(object)]

  const next = () => {
    const found = validators[step]()
    setErrors(found)
    if (Object.keys(found).length === 0) setStep(step + 1)
  }

  const submit = () =>
    run(async () => {
      const found = validators[step]()
      setErrors(found)
      if (Object.keys(found).length > 0) return
      const result = await createTaxpayer({
        type: identity.type,
        name: identity.name.trim(),
        ownerName: identity.ownerName.trim(),
        nik: identity.type === 'pribadi' ? identity.nik : undefined,
        npwp: identity.type === 'badan' ? identity.npwp : undefined,
        phone: identity.phone.trim(),
        email: identity.email.trim() || undefined,
        address: identity.address.trim(),
        distrikId: identity.distrikId,
        kampungId: identity.kampungId,
        object: toObjectInput(object),
      })
      toast.success('Wajib pajak didaftarkan dan menunggu verifikasi.')
      await navigate({ to: '/wajib-pajak/$id', params: { id: result.id } })
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1',
                i === step && 'border-primary bg-primary text-primary-foreground',
                i < step && 'text-muted-foreground',
              )}
            >
              {i < step ? <CheckIcon className="size-3.5" /> : <span className="tabular-nums">{i + 1}</span>}
              {label}
            </li>
          ))}
        </ol>

        {error && <FormAlert>{error}</FormAlert>}
        {Object.keys(errors).length > 0 && <FormAlert>Periksa kembali isian yang ditandai merah.</FormAlert>}

        {step === 0 && <IdentityFields values={identity} errors={errors} onChange={(patch) => setIdentity({ ...identity, ...patch })} />}
        {step === 1 && (
          <AddressFields values={identity} errors={errors} regions={regions} onChange={(patch) => setIdentity({ ...identity, ...patch })} />
        )}
        {step === 2 && <ObjectFields values={object} errors={errors} onChange={(patch) => setObject({ ...object, ...patch })} />}

        <div className="flex justify-between gap-2">
          <Button variant="outline" disabled={step === 0 || pending} onClick={() => setStep(step - 1)}>
            Kembali
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Lanjut</Button>
          ) : (
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              Daftarkan WP
            </Button>
          )}
        </div>
      </div>

      <SummaryCard
        title="Ringkasan"
        rows={[
          { label: 'Jenis WP', value: identity.type === 'badan' ? 'Badan' : 'Pribadi' },
          { label: 'Nama', value: identity.name || '-' },
          { label: 'Pemilik', value: identity.ownerName || '-' },
          {
            label: 'Lokasi',
            value: identity.kampungId ? `${kampungName(identity.distrikId, identity.kampungId)}, ${distrikName(identity.distrikId)}` : '-',
          },
          { label: 'Objek', value: object.name || '-' },
          { label: 'Jenis pajak', value: object.taxCode ? revenueName(object.taxCode) : '-' },
        ]}
        footer="Status awal: Verifikasi. NPWPD diterbitkan setelah disetujui."
      />
    </div>
  )
}
