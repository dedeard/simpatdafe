import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VESSEL_TYPE_LABEL, createVessel, type VesselType } from '@/lib/api/resources'
import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NumberField, SelectField, TextField } from '../../../-components'
import { useSubmit } from '../../../-hooks'
import { toOptions } from '../../../-utils'

export function VesselDialog({
  onCreated,
  label = 'Kapal baru',
}: {
  onCreated: (vessel: { id: string; name: string }) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<VesselType | ''>('')
  const [gt, setGt] = useState<number | undefined>()
  const [owner, setOwner] = useState('')
  const [homePort, setHomePort] = useState('Sorong')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftarkan kapal</DialogTitle>
            <DialogDescription>Kapal tersimpan di daftar kapal dan dapat dipilih pada tagihan berikutnya.</DialogDescription>
          </DialogHeader>
          {error && <FormAlert>{error}</FormAlert>}
          <TextField label="Nama kapal" required value={name} error={errors.name} onChange={setName} />
          <SelectField
            label="Jenis kapal"
            required
            value={type}
            error={errors.type}
            onChange={(v) => setType(v as VesselType)}
            options={toOptions(VESSEL_TYPE_LABEL)}
          />
          <NumberField label="Gross tonnage (GT)" required min={1} value={gt} error={errors.gt} onChange={setGt} />
          <TextField label="Pemilik" required value={owner} error={errors.owner} onChange={setOwner} />
          <TextField label="Pelabuhan asal" value={homePort} onChange={setHomePort} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const e: Record<string, string> = {}
                  if (!name.trim()) e.name = 'Nama kapal wajib diisi.'
                  if (!type) e.type = 'Pilih jenis kapal.'
                  if (!gt || gt <= 0) e.gt = 'GT harus lebih dari 0.'
                  if (!owner.trim()) e.owner = 'Pemilik wajib diisi.'
                  setErrors(e)
                  if (Object.keys(e).length > 0 || !type || !gt) return
                  const created = await createVessel({ name, type, grossTonnage: gt, owner, homePort })
                  toast.success('Kapal didaftarkan.')
                  onCreated(created)
                  setOpen(false)
                  setName('')
                  setGt(undefined)
                  setOwner('')
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
