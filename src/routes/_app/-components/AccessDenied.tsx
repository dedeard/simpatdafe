import { Button } from '@/components/ui/button'
import { ACTION_LABEL, moduleLabel, moduleOf, type Permission, type PermissionAction } from '@/lib/permissions'
import { Link } from '@tanstack/react-router'
import { ShieldXIcon } from 'lucide-react'
import { usePermissions } from '../-hooks'

export function AccessDenied({ permission }: { permission: Permission }) {
  const { role, can } = usePermissions()
  const action = permission.slice(permission.lastIndexOf('.') + 1) as PermissionAction

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldXIcon className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">Tidak ada akses</h1>
        <p className="text-sm text-muted-foreground">
          Peran <span className="font-medium text-foreground">{role?.name ?? '-'}</span> tidak memiliki izin{' '}
          <span className="font-medium text-foreground">
            {ACTION_LABEL[action].toLowerCase()} {moduleLabel(moduleOf(permission))}
          </span>
          . Hubungi administrator untuk menambahkan izin ke peran Anda.
        </p>
        {can('dashboard.read') && (
          <Button variant="outline" nativeButton={false} render={<Link to="/dashboard" />}>
            Kembali ke beranda
          </Button>
        )}
      </div>
    </div>
  )
}
