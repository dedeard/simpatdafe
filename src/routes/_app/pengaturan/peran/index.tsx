import { Button } from '@/components/ui/button'
import { deleteRole, type Role } from '@/lib/api/resources'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Can, ConfirmDialog, PageHeader } from '../../-components'
import { useAppData } from '../../-hooks'
import { RoleCard } from './-components'

export const Route = createFileRoute('/_app/pengaturan/peran/')({
  head: () => ({ meta: [{ title: 'Peran & hak akses | SIMPATDA Raja Ampat' }] }),
  component: RolesPage,
})

function RolesPage() {
  const router = useRouter()
  const { roles, users } = useAppData()
  const [deleting, setDeleting] = useState<Role | null>(null)
  const memberCount = (id: string) => users.filter((u) => u.roleId === id).length

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Peran & hak akses"
        description="Pengguna mendapat izin dari perannya. Buat peran sesuai tugas, lalu pilih izin baca dan tulis per modul."
        actions={
          <Can permission="roles.create">
            <Button nativeButton={false} render={<Link to="/pengaturan/peran/create" search={{ from: undefined }} />}>
              <PlusIcon />
              Tambah peran
            </Button>
          </Can>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} memberCount={memberCount(role.id)} onDelete={setDeleting} />
        ))}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Hapus peran ${deleting?.name ?? ''}?`}
        description="Peran yang dihapus tidak dapat dipulihkan. Pengguna tidak terpengaruh karena peran ini tidak dipakai siapa pun."
        confirmLabel="Hapus peran"
        destructive
        onConfirm={async () => {
          if (!deleting) return
          await deleteRole(deleting.id)
          toast.success(`Peran ${deleting.name} dihapus.`)
          await router.invalidate()
        }}
      />
    </div>
  )
}
