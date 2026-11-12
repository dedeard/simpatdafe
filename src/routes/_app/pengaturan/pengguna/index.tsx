import { FormAlert } from '@/components/form-alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { saveUser, type AppUser } from '@/lib/api/resources'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2Icon, PencilIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Can, PageHeader, SelectField, TextField } from '../../-components'
import { useAppData, usePermissions, useSubmit } from '../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/pengguna/')({
  head: () => ({ meta: [{ title: 'Pengguna | SIMPATDA Raja Ampat' }] }),
  component: UsersPage,
})

type Draft = { id?: string; name: string; email: string; roleId: string; post: string; status: 'active' | 'inactive' }

function UserDialog({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const router = useRouter()
  const { roles } = useAppData()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const { pending, error, run } = useSubmit()
  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Ubah pengguna' : 'Tambah pengguna'}</DialogTitle>
          <DialogDescription>Kata sandi tidak dikelola di demo ini.</DialogDescription>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <TextField label="Nama" required value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Email" required type="email" value={draft.email} error={errors.email} onChange={(email) => patch({ email })} />
        <SelectField
          label="Peran"
          required
          value={draft.roleId}
          error={errors.roleId}
          onChange={(roleId) => patch({ roleId })}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
        <TextField
          label="Pos / loket"
          value={draft.post}
          onChange={(post) => patch({ post })}
          placeholder="mis. Pelabuhan Waisai"
          hint="Opsional. Isi untuk petugas yang bertugas di pos tertentu."
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(status) => patch({ status: status as Draft['status'] })}
          options={[
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Tidak aktif' },
          ]}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                const e: Record<string, string> = {}
                if (!draft.name.trim()) e.name = 'Nama wajib diisi.'
                if (!/^\S+@\S+\.\S+$/.test(draft.email)) e.email = 'Format email tidak valid.'
                if (!draft.roleId) e.roleId = 'Pilih peran.'
                setErrors(e)
                if (Object.keys(e).length > 0) return
                await saveUser({
                  id: draft.id,
                  name: draft.name,
                  email: draft.email,
                  roleId: draft.roleId,
                  post: draft.post.trim() || undefined,
                  status: draft.status,
                })
                toast.success('Pengguna disimpan.')
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

function UsersPage() {
  const { users, roles } = useAppData()
  const { can } = usePermissions()
  const [editing, setEditing] = useState<Draft | null>(null)
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id
  const edit = (u: AppUser) =>
    setEditing({ id: u.id, name: u.name, email: u.email, roleId: u.roleId, post: u.post ?? '', status: u.status })

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Pengguna"
        description="Akun pegawai BP2RD. Izin setiap pengguna mengikuti perannya, atur di tab Peran & akses."
        actions={
          <Can permission="users.create">
            <Button onClick={() => setEditing({ name: '', email: '', roleId: '', post: '', status: 'active' })}>
              <PlusIcon />
              Tambah pengguna
            </Button>
          </Can>
        }
      />
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead className="hidden md:table-cell">Pos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {can('roles.read') ? (
                      <Link to="/pengaturan/peran/$roleId" params={{ roleId: u.roleId }} className="underline-offset-4 hover:underline">
                        {roleName(u.roleId)}
                      </Link>
                    ) : (
                      roleName(u.roleId)
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{u.post ?? '-'}</TableCell>
                  <TableCell>
                    {u.status === 'active' ? <Badge variant="secondary">Aktif</Badge> : <Badge variant="outline">Tidak aktif</Badge>}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Can permission="users.update">
                      <Button size="icon-sm" variant="ghost" aria-label={`Ubah ${u.name}`} onClick={() => edit(u)}>
                        <PencilIcon />
                      </Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editing && <UserDialog initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
