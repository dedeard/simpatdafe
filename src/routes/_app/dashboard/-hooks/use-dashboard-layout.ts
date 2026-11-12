import { defaultLayout, permittedLayout, sanitizeLayout, type DashboardLayout } from '@/lib/dashboard-widgets'
import { useSyncExternalStore } from 'react'
import { usePermissions } from '../../-hooks'

const keyFor = (roleId: string) => `simpatda.dashboard.${roleId}`
const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string; layout: DashboardLayout }>()

function readRaw(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function parse(key: string, raw: string | null) {
  if (raw === null) return null
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.layout
  let layout: DashboardLayout
  try {
    layout = sanitizeLayout(JSON.parse(raw))
  } catch {
    layout = []
  }
  cache.set(key, { raw, layout })
  return layout
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function write(key: string, layout: DashboardLayout | null) {
  try {
    if (layout === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(layout))
  } catch {
    // storage unavailable: the layout lasts until reload
  }
  listeners.forEach((l) => l())
}

export type LayoutSource = 'personal' | 'role' | 'auto'

export function useDashboardLayout() {
  const { role, can } = usePermissions()
  const key = keyFor(role?.id ?? 'none')
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  )
  const personal = parse(key, raw)

  const roleLayout = role?.dashboard ? sanitizeLayout(role.dashboard) : null
  const roleDefault = permittedLayout(roleLayout ?? defaultLayout(can), can)
  const source: LayoutSource = personal ? 'personal' : roleLayout ? 'role' : 'auto'
  const layout = personal ? permittedLayout(personal, can) : roleDefault

  return {
    role,
    layout,
    roleDefault,
    source,
    savePersonal: (next: DashboardLayout) => write(key, next),
    clearPersonal: () => write(key, null),
  }
}
