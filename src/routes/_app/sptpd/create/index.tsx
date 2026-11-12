import { getTaxpayer } from '@/lib/api/resources'
import { createFileRoute } from '@tanstack/react-router'
import { SptpdForm } from '../-components/SptpdForm'
import { PageHeader } from '../../-components'

export const Route = createFileRoute('/_app/sptpd/create/')({
  head: () => ({ meta: [{ title: 'Buat SPTPD | SIMPATDA Raja Ampat' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    taxpayerId: typeof search.taxpayerId === 'string' ? search.taxpayerId : undefined,
    objectId: typeof search.objectId === 'string' ? search.objectId : undefined,
    period: typeof search.period === 'string' ? search.period : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.taxpayerId) return undefined
    const { taxpayer, objects } = await getTaxpayer(deps.taxpayerId)
    return {
      taxpayer: {
        id: taxpayer.id,
        npwpd: taxpayer.npwpd ?? '-',
        name: taxpayer.name,
        ownerName: taxpayer.ownerName,
        distrik: taxpayer.distrik,
        type: taxpayer.type,
      },
      objects: objects.filter((o) => o.status === 'active'),
      objectId: deps.objectId,
      period: deps.period,
    }
  },
  component: CreateSptpdPage,
})

function CreateSptpdPage() {
  const initial = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title="Buat SPTPD"
        description="Catat laporan pajak atas nama wajib pajak, atau lengkapi laporan yang belum masuk."
        back={{ to: '/sptpd', label: 'Daftar SPTPD' }}
      />
      <SptpdForm key={`${initial?.taxpayer.id ?? 'new'}-${initial?.objectId ?? ''}`} initial={initial} />
    </div>
  )
}
