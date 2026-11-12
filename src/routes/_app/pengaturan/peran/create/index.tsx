import { createFileRoute } from '@tanstack/react-router'
import { RoleEditor } from '../-components'
import { PageHeader } from '../../../-components'
import { useAppData } from '../../../-hooks'

export const Route = createFileRoute('/_app/pengaturan/peran/create/')({
  head: () => ({ meta: [{ title: 'Tambah peran | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({ from: typeof search.from === 'string' ? search.from : undefined }),
  component: CreateRolePage,
})

function CreateRolePage() {
  const { from } = Route.useSearch()
  const { roles } = useAppData()
  const source = from ? roles.find((r) => r.id === from) : undefined

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={source ? `Duplikat ${source.name}` : 'Tambah peran'}
        description={source ? 'Izin disalin dari peran asal. Ubah nama dan sesuaikan izinnya.' : 'Beri nama peran lalu pilih izinnya.'}
        back={{ to: '/pengaturan/peran', label: 'Peran & hak akses' }}
      />
      <RoleEditor
        key={source?.id ?? 'new'}
        initial={{
          name: source ? `${source.name} (salinan)` : '',
          description: source?.description ?? '',
          permissions: source ? [...source.permissions] : ['dashboard.read'],
        }}
      />
    </div>
  )
}
