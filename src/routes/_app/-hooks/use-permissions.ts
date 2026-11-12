import { ADMIN_ROLE_ID } from '@/lib/api/resources'
import type { Permission } from '@/lib/permissions'
import { useMemo } from 'react'
import { useAppData } from './use-app-data'
import { useRole } from './use-role'

export function usePermissions() {
  const { roles } = useAppData()
  const { roleId, setRole } = useRole()

  const role = roles.find((r) => r.id === roleId) ?? roles.find((r) => r.id === ADMIN_ROLE_ID) ?? roles[0]
  const granted = useMemo(() => new Set<Permission>(role?.permissions ?? []), [role])

  const can = (permission: Permission | ReadonlyArray<Permission>) => {
    if (!role) return false
    if (role.system) return true
    const list: ReadonlyArray<Permission> = typeof permission === 'string' ? [permission] : permission
    return list.some((p) => granted.has(p))
  }

  return { role, roles, can, setRole }
}
