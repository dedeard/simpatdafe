import { FormAlert } from '@/components/form-alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveRegion, type RegionInput } from '@/lib/api/resources'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2Icon, PencilIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, TextField } from '../../-components'
import { useAppData, useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/wilayah/')({
  head: () => ({ meta: [{ title: 'Wilayah | SIMPATDA Raja Ampat' }] }),
  component: RegionsPage,
})

type Editing = { level: 'distrik' | 'kampung'; id?: string; parentId?: string; code: string; name: string; parentName?: string }

function RegionDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const router = useRouter()
  const [code, setCode] = useState(editing.code)
  const [name, setName] = useState(editing.name)
  const { pending, error, run } = useSubmit()
  const label = editing.level === 'distrik' ? 'distrik' : 'kampung'
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing.id ? 'Ubah' : 'Tambah'} {label}
          </DialogTitle>
          <DialogDescription>
            {editing.parentName ? `Di distrik ${editing.parentName}.` : 'Kode digunakan pada NPWPD dan NOP.'}
          </DialogDescription>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <TextField
          label="Kode (2 digit)"
          required
          maxLength={2}
          inputMode="numeric"
          value={code}
          onChange={(v) => setCode(v.replace(/\D/g, ''))}
        />
        <TextField label={`Nama ${label}`} required value={name} onChange={setName} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                const input: RegionInput = { level: editing.level, id: editing.id, parentId: editing.parentId, code, name }
                await saveRegion(input)
                toast.success(`${label[0].toUpperCase()}${label.slice(1)} disimpan.`)
                onClose()
                await router.invalidate()
              })
            }
          >
            {pending && <Loader2Icon className="animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RegionsPage() {
  const { regions } = useAppData()
  const [editing, setEditing] = useState<Editing | null>(null)
  const nextCode = String(regions.reduce((max, r) => Math.max(max, Number(r.code)), 0) + 1).padStart(2, '0')

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Wilayah"
        description="Distrik dan kampung yang dipakai di NPWPD, NOP, dan laporan per wilayah."
        actions={
          <Button onClick={() => setEditing({ level: 'distrik', code: nextCode, name: '' })}>
            <PlusIcon />
            Tambah distrik
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {regions.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <CardTitle>
                {d.name} <span className="font-mono text-xs font-normal text-muted-foreground">({d.code})</span>
              </CardTitle>
              <CardDescription>{d.kampung.length} kampung</CardDescription>
              <CardAction className="flex gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Ubah ${d.name}`}
                  onClick={() => setEditing({ level: 'distrik', id: d.id, code: d.code, name: d.name })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Tambah kampung di ${d.name}`}
                  onClick={() =>
                    setEditing({
                      level: 'kampung',
                      parentId: d.id,
                      parentName: d.name,
                      code: String(d.kampung.reduce((m, k) => Math.max(m, Number(k.code)), 0) + 1).padStart(2, '0'),
                      name: '',
                    })
                  }
                >
                  <PlusIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {d.kampung.map((k) => (
                <Badge
                  key={k.id}
                  variant="secondary"
                  render={
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ level: 'kampung', id: k.id, parentId: d.id, parentName: d.name, code: k.code, name: k.name })
                      }
                    />
                  }
                >
                  {k.code} · {k.name}
                </Badge>
              ))}
              {d.kampung.length === 0 && <span className="text-sm text-muted-foreground">Belum ada kampung.</span>}
            </CardContent>
          </Card>
        ))}
      </div>
      {editing && <RegionDialog editing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
