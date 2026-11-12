import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SectionTabs } from '../-components'
import { usePermissions } from '../-hooks'
import { SETTINGS_TABS } from './-constants'

export const Route = createFileRoute('/_app/pengaturan')({ component: SettingsLayout })

function SettingsLayout() {
  const { can } = usePermissions()
  const tabs = SETTINGS_TABS.filter((tab) => !tab.permission || can(tab.permission))
  return (
    <div className="flex flex-col">
      <SectionTabs label="Pengaturan" tabs={tabs} className="px-4 pt-4 md:px-6 md:pt-6" />
      <Outlet />
    </div>
  )
}
