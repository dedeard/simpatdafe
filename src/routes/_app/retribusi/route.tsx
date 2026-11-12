import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AnchorIcon, ReceiptTextIcon, TicketIcon } from 'lucide-react'
import { SectionTabs, type SectionTab } from '../-components'

export const Route = createFileRoute('/_app/retribusi')({ component: RetributionLayout })

const TABS: Array<SectionTab> = [
  { to: '/retribusi/tanda-masuk', label: 'Tanda masuk wisata', icon: TicketIcon },
  { to: '/retribusi/kepelabuhanan', label: 'Kepelabuhanan', icon: AnchorIcon },
  { to: '/retribusi/skrd', label: 'Retribusi lainnya', icon: ReceiptTextIcon },
]

function RetributionLayout() {
  return (
    <div className="flex flex-col">
      <SectionTabs label="Jenis retribusi" tabs={TABS} className="px-4 pt-4 md:px-6 md:pt-6" />
      <Outlet />
    </div>
  )
}
