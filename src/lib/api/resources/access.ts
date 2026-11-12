import type { DashboardLayout } from '@/lib/dashboard-widgets'
import type { Permission } from '@/lib/permissions'
import { call } from '../rpc'

export type Role = {
  id: string
  name: string
  description: string
  permissions: Array<Permission>
  system?: boolean
  // null or missing: generated from the role's permissions
  dashboard?: DashboardLayout | null
}

export type RoleInput = { id?: string; name: string; description: string; permissions: Array<Permission> }

export const ADMIN_ROLE_ID = 'admin'

export const saveRole = (input: RoleInput) => call('access.saveRole', input)
export const deleteRole = (id: string) => call('access.deleteRole', id)
export const saveRoleDashboard = (input: { roleId: string; layout: DashboardLayout | null }) => call('access.saveDashboard', input)
