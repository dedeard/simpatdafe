import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addTaxObject, type TaxpayerRow } from '@/lib/api/resources'
import { useRouter } from '@tanstack/react-router'
import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSubmit } from '../../-hooks'
import type { Errors } from './IdentityFields'
import { EMPTY_OBJECT, ObjectFields, toObjectInput, validateObject, type ObjectValues } from './ObjectFields'

export function AddObjectDialog({ taxpayer }: { taxpayer: TaxpayerRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<ObjectValues>(EMPTY_OBJECT)
  const [errors, setErrors] = useState<Errors>({})
  const { pending, error, run, setError } = useSubmit()

  const change = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setValues(EMPTY_OBJECT)
      setErrors({})
      setError(undefined)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => change(true)} disabled={taxpayer.status === 'closed'}>
        <PlusIcon />
        Tambah objek
      </Button>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah objek pajak</DialogTitle>
            <DialogDescription>Untuk {taxpayer.name}</DialogDescription>
          </DialogHeader>
          {error && <FormAlert>{error}</FormAlert>}
          <ObjectFields title="Data objek" values={values} errors={errors} onChange={(patch) => setValues({ ...values, ...patch })} />
          <DialogFooter>
            <Button variant="outline" onClick={() => change(false)} disabled={pending}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const found = validateObject(values)
                  setErrors(found)
                  if (Object.keys(found).length > 0) return
                  await addTaxObject({ taxpayerId: taxpayer.id, object: toObjectInput(values) })
                  toast.success('Objek pajak ditambahkan.')
                  change(false)
                  await router.invalidate()
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Simpan objek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
