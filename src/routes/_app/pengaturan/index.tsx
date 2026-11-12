import { Navigate, createFileRoute } from '@tanstack/react-router'
import { usePermissions } from '../-hooks'
import { SETTINGS_TABS } from './-constants'

export const Route = createFileRoute('/_app/pengaturan/')({ component: SettingsIndex })

function SettingsIndex() {
  const { can } = usePermissions()
  const first = SETTINGS_TABS.find((tab) => !tab.permission || can(tab.permission)) ?? SETTINGS_TABS[SETTINGS_TABS.length - 1]
  return <Navigate to={first.to} replace />
}
