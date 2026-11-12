import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { saveRole, type AppUser, type Role } from '@/lib/api/resources'
import { DASHBOARD_WIDGETS } from '@/lib/dashboard-widgets'
import { accessLevel, ALL_PERMISSIONS, PERMISSION_MODULES, type Permission } from '@/lib/permissions'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Loader2Icon, LockIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TextAreaField, TextField } from '../../../-components'
import { usePermissions, useSubmit } from '../../../-hooks'
import { PermissionMatrix } from './PermissionMatrix'

export type RoleDraft = { id?: string; name: string; description: string; permissions: Array<Permission> }

type RoleEditorProps = {
  initial: RoleDraft
  role?: Role
  members?: Array<AppUser>
}

export function RoleEditor({ initial, role, members = [] }: RoleEditorProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<{ name?: string; permissions?: string }>({})
  const { pending, error, run } = useSubmit()

  const isSystem = Boolean(role?.system)
  const editable = !isSystem && (draft.id ? can('roles.update') : can('roles.create'))
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const permissions = isSystem ? [...ALL_PERMISSIONS] : draft.permissions

  const granted = new Set(permissions)
  const levels = PERMISSION_MODULES.map((m) => accessLevel(granted, m))
  const modules = levels.filter((l) => l !== 'none').length
  const writes = permissions.filter((p) => !p.endsWith('.read')).length
  const widgets = DASHBOARD_WIDGETS.filter((w) => granted.has(w.permission))

  const submit = () =>
    run(async () => {
      const next: typeof errors = {}
      if (!draft.name.trim()) next.name = 'Nama peran wajib diisi.'
      if (draft.permissions.length === 0) next.permissions = 'Pilih minimal satu izin.'
      setErrors(next)
      if (Object.keys(next).length > 0) return
      await saveRole(draft)
      toast.success(draft.id ? `Peran ${draft.name.trim()} diperbarui.` : `Peran ${draft.name.trim()} dibuat.`)
      await router.invalidate()
      await navigate({ to: '/pengaturan/peran' })
    })

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="flex min-w-0 flex-col gap-4 md:gap-6">
        {isSystem && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <span className="font-medium">Peran sistem.</span>{' '}
              <span className="text-muted-foreground">
                Administrator selalu memiliki semua izin agar sistem tidak terkunci, sehingga tidak dapat diubah atau dihapus.
              </span>
            </p>
          </div>
        )}
        {error && <FormAlert>{error}</FormAlert>}
        <Card>
          <CardHeader>
            <CardTitle>Informasi peran</CardTitle>
            <CardDescription>Nama tampil di daftar pengguna dan pengalih peran.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              label="Nama peran"
              required
              maxLength={50}
              value={draft.name}
              error={errors.name}
              disabled={!editable}
              placeholder="mis. Verifikator Lapangan"
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <TextAreaField
              label="Deskripsi"
              rows={2}
              maxLength={200}
              value={draft.description}
              disabled={!editable}
              placeholder="Tugas utama peran ini"
              onChange={(description) => setDraft({ ...draft, description })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hak akses</CardTitle>
            <CardDescription>
              Centang izin per modul. Baca untuk melihat data, Tulis untuk menambah, mengubah dan menghapus.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {errors.permissions && <FormAlert>{errors.permissions}</FormAlert>}
            <PermissionMatrix value={permissions} disabled={!editable} onChange={(next) => setDraft({ ...draft, permissions: next })} />
          </CardContent>
        </Card>
      </div>
      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Modul', value: `${modules}/${PERMISSION_MODULES.length}` },
              { label: 'Baca', value: permissions.length - writes },
              { label: 'Tulis', value: writes },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-2">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Widget dasbor ({widgets.length}/{DASHBOARD_WIDGETS.length})
            </span>
            {widgets.length === 0 ? (
              <span className="text-muted-foreground">Tidak ada widget. Beri izin baca modul agar widgetnya muncul.</span>
            ) : (
              <ul className="flex flex-wrap gap-1">
                {widgets.map((w) => (
                  <li key={w.id} className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                    {w.title}
                  </li>
                ))}
              </ul>
            )}
            <span className="text-xs text-muted-foreground">
              {role?.dashboard ? 'Urutan dasbor peran ini sudah diatur khusus.' : 'Urutan mengikuti bawaan.'} Atur dari Beranda melalui Atur
              dasbor.
            </span>
          </div>
          {draft.id && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Pengguna dengan peran ini ({members.length})</span>
              {members.length === 0 ? (
                <span className="text-muted-foreground">Belum ada pengguna.</span>
              ) : (
                <ul className="flex flex-col gap-1">
                  {members.slice(0, 8).map((u) => (
                    <li key={u.id} className="flex justify-between gap-2">
                      <span className="truncate">{u.name}</span>
                      {u.status === 'inactive' && <span className="text-xs text-muted-foreground">nonaktif</span>}
                    </li>
                  ))}
                  {members.length > 8 && <li className="text-muted-foreground">+{members.length - 8} lainnya</li>}
                </ul>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2 border-t pt-4">
            {editable && (
              <Button disabled={pending || !dirty} onClick={submit}>
                {pending && <Loader2Icon className="animate-spin" />}
                {draft.id ? 'Simpan perubahan' : 'Buat peran'}
              </Button>
            )}
            <Button variant="outline" nativeButton={false} render={<Link to="/pengaturan/peran" />}>
              {editable ? 'Batal' : 'Kembali'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
