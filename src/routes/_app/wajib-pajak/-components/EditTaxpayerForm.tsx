import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { updateTaxpayer, type TaxpayerRow } from '@/lib/api/resources'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAppData, useSubmit } from '../../-hooks'
import { AddressFields, IdentityFields, validateAddress, validateIdentity, type Errors, type IdentityValues } from './IdentityFields'

export function EditTaxpayerForm({ taxpayer }: { taxpayer: TaxpayerRow }) {
  const navigate = useNavigate()
  const { regions } = useAppData()
  const [values, setValues] = useState<IdentityValues>({
    type: taxpayer.type,
    name: taxpayer.name,
    ownerName: taxpayer.ownerName,
    nik: taxpayer.nik ?? '',
    npwp: taxpayer.npwp ?? '',
    phone: taxpayer.phone,
    email: taxpayer.email ?? '',
    distrikId: taxpayer.distrikId,
    kampungId: taxpayer.kampungId,
    address: taxpayer.address,
  })
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, run } = useSubmit()

  return (
    <div className="flex flex-col gap-4">
      {error && <FormAlert>{error}</FormAlert>}
      <IdentityFields values={values} errors={errors} lockType onChange={(patch) => setValues({ ...values, ...patch })} />
      <AddressFields values={values} errors={errors} regions={regions} onChange={(patch) => setValues({ ...values, ...patch })} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: '/wajib-pajak/$id', params: { id: taxpayer.id } })} disabled={pending}>
          Batal
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            run(async () => {
              const found = { ...validateIdentity(values), ...validateAddress(values) }
              setErrors(found)
              if (Object.keys(found).length > 0) return
              await updateTaxpayer({
                id: taxpayer.id,
                name: values.name,
                ownerName: values.ownerName,
                nik: values.type === 'pribadi' ? values.nik : undefined,
                npwp: values.type === 'badan' ? values.npwp : undefined,
                phone: values.phone,
                email: values.email || undefined,
                address: values.address,
                distrikId: values.distrikId,
                kampungId: values.kampungId,
              })
              toast.success('Data wajib pajak diperbarui.')
              await navigate({ to: '/wajib-pajak/$id', params: { id: taxpayer.id } })
            })
          }
        >
          {pending && <Loader2Icon className="animate-spin" />}
          Simpan perubahan
        </Button>
      </div>
    </div>
  )
}
