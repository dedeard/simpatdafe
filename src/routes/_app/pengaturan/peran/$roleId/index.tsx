import { Badge } from '@/components/ui/badge'
import { createFileRoute } from '@tanstack/react-router'
import { LockIcon } from 'lucide-react'
import { RoleEditor } from '../-components'
import { PageHeader } from '../../../-components'
import { useAppData } from '../../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/peran/$roleId/')({
  head: () => ({ meta: [{ title: 'Peran | SIMPATDA Raja Ampat' }] }),
  component: RolePage,
})

function RolePage() {
  const { roleId } = Route.useParams()
  const { roles, users } = useAppData()
  const role = roles.find((r) => r.id === roleId)
  const back = { to: '/pengaturan/peran' as const, label: 'Peran & hak akses' }

  if (!role) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <PageHeader title="Peran tidak ditemukan" description="Peran ini mungkin sudah dihapus." back={back} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={role.name}
        description={role.description || 'Atur izin baca dan tulis untuk peran ini.'}
        back={back}
        badge={
          role.system ? (
            <Badge variant="secondary" className="gap-1">
              <LockIcon className="size-3" />
              Sistem
            </Badge>
          ) : undefined
        }
      />
      <RoleEditor
        key={role.id}
        role={role}
        members={users.filter((u) => u.roleId === role.id)}
        initial={{ id: role.id, name: role.name, description: role.description, permissions: [...role.permissions] }}
      />
    </div>
  )
}
