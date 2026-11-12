import { Outlet, createFileRoute } from '@tanstack/react-router'
import { CalendarDaysIcon, ChartColumnIcon, HourglassIcon, UserRoundIcon } from 'lucide-react'
import { SectionTabs, type SectionTab } from '../-components'

export const Route = createFileRoute('/_app/laporan')({ component: ReportsLayout })

const TABS: Array<SectionTab> = [
  { to: '/laporan/realisasi', label: 'Realisasi', icon: ChartColumnIcon },
  { to: '/laporan/harian', label: 'Penerimaan harian', icon: CalendarDaysIcon },
  { to: '/laporan/per-wp', label: 'Per wajib pajak', icon: UserRoundIcon },
  { to: '/laporan/piutang', label: 'Piutang', icon: HourglassIcon },
]

function ReportsLayout() {
  return (
    <div className="flex flex-col">
      <SectionTabs label="Jenis laporan" tabs={TABS} className="px-4 pt-4 md:px-6 md:pt-6" />
      <Outlet />
    </div>
  )
}
