import type { Permission } from '@/lib/permissions'
import { usePermissions } from '../-hooks'

type CanProps = {
  permission: Permission | ReadonlyArray<Permission>
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  return <>{can(permission) ? children : fallback}</>
}
