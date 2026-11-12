import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveSignatory, type Signatory } from '@/lib/api/resources'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, TextField } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'
import { digitsOnly } from '../../-utils'

export const Route = createFileRoute('/_app/pengaturan/penandatangan/')({
  head: () => ({ meta: [{ title: 'Penandatangan | SIMPATDA Raja Ampat' }] }),
  component: SignatoriesPage,
})

function SignatoryCard({ initial }: { initial: Signatory }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string>()
  const { pending, error: serverError, run } = useSubmit()
  const dirty = JSON.stringify(value) !== JSON.stringify(initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(error || serverError) && <FormAlert>{error ?? serverError}</FormAlert>}
        <TextField label="Jabatan" value={value.title} onChange={(title) => setValue({ ...value, title })} />
        <TextField label="Nama" value={value.name} onChange={(name) => setValue({ ...value, name })} />
        <TextField
          label="NIP"
          inputMode="numeric"
          maxLength={18}
          value={value.nip}
          onChange={(nip) => setValue({ ...value, nip: digitsOnly(nip) })}
          hint="18 digit"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!dirty || pending}
            onClick={() => {
              if (!/^\d{18}$/.test(value.nip)) return setError('NIP harus 18 digit.')
              setError(undefined)
              void run(async () => {
                await saveSignatory(value)
                toast.success(`Penandatangan ${initial.label} disimpan.`)
                await router.invalidate()
              })
            }}
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Simpan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SignatoriesPage() {
  const { signatories } = useAppData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader title="Penandatangan" description="Pejabat yang tertera pada dokumen cetak. Nama dan NIP di demo ini fiktif." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {signatories.map((s) => (
          <SignatoryCard key={`${s.kind}-${s.name}-${s.nip}-${s.title}`} initial={s} />
        ))}
      </div>
    </div>
  )
}
