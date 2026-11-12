import { getTaxpayer } from '@/lib/api/resources'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { HistoryIcon, IdCardIcon, StoreIcon } from 'lucide-react'
import { TaxpayerActions } from '../-components/TaxpayerActions'
import { PageHeader, SectionTabs, StatusBadge, TAXPAYER_STATUS_MAP } from '../../-components'

export const Route = createFileRoute('/_app/wajib-pajak/$id')({
  loader: ({ params }) => getTaxpayer(params.id),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.taxpayer.name ?? 'Wajib pajak'} | SIMPATDA Raja Ampat` }] }),
  component: TaxpayerLayout,
})

const TABS = [
  { to: '/wajib-pajak/$id', label: 'Profil', icon: IdCardIcon, exact: true },
  { to: '/wajib-pajak/$id/objek', label: 'Objek pajak', icon: StoreIcon },
  { to: '/wajib-pajak/$id/riwayat', label: 'Riwayat', icon: HistoryIcon },
] as const

function TaxpayerLayout() {
  const { taxpayer } = Route.useLoaderData()
  const { id } = Route.useParams()

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <PageHeader
        title={taxpayer.name}
        description={taxpayer.npwpd ? `NPWPD ${taxpayer.npwpd}` : 'NPWPD belum terbit'}
        back={{ to: '/wajib-pajak', label: 'Daftar WP' }}
        badge={<StatusBadge status={taxpayer.status} map={TAXPAYER_STATUS_MAP} />}
        actions={<TaxpayerActions taxpayer={taxpayer} />}
      />
      <SectionTabs label="Bagian wajib pajak" tabs={TABS.map((tab) => ({ ...tab, params: { id } }))} />
      <Outlet />
    </div>
  )
}
