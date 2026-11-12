import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Role } from '@/lib/api/resources'
import { accessLevel, PERMISSION_MODULES, type AccessLevel } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import { CopyIcon, EllipsisVerticalIcon, EyeIcon, LockIcon, PencilIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { usePermissions } from '../../../-hooks'

const SHOWN = 8

const DOT: Record<Exclude<AccessLevel, 'none'>, string> = {
  read: 'bg-muted-foreground/50',
  write: 'bg-amber-500',
  full: 'bg-primary',
}

type RoleCardProps = { role: Role; memberCount: number; onDelete: (role: Role) => void }

export function RoleCard({ role, memberCount, onDelete }: RoleCardProps) {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const granted = new Set(role.permissions)
  const modules = PERMISSION_MODULES.map((m) => ({ module: m, level: role.system ? 'full' : accessLevel(granted, m) })).filter(
    (x): x is { module: (typeof PERMISSION_MODULES)[number]; level: Exclude<AccessLevel, 'none'> } => x.level !== 'none',
  )
  const writes = role.permissions.filter((p) => !p.endsWith('.read')).length
  const editable = !role.system && can('roles.update')
  const open = () => navigate({ to: '/pengaturan/peran/$roleId', params: { roleId: role.id } })

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link to="/pengaturan/peran/$roleId" params={{ roleId: role.id }} className="truncate hover:underline">
            {role.name}
          </Link>
          {role.system && (
            <Badge variant="secondary" className="gap-1">
              <LockIcon className="size-3" />
              Sistem
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="line-clamp-2">{role.description || 'Tanpa deskripsi.'}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${role.name}`} />}>
              <EllipsisVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={open}>
                {editable ? <PencilIcon /> : <EyeIcon />}
                {editable ? 'Ubah izin' : 'Lihat izin'}
              </DropdownMenuItem>
              {can('roles.create') && (
                <DropdownMenuItem onClick={() => navigate({ to: '/pengaturan/peran/create', search: { from: role.id } })}>
                  <CopyIcon />
                  Duplikat
                </DropdownMenuItem>
              )}
              {!role.system && can('roles.delete') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={memberCount > 0} onClick={() => onDelete(role)}>
                    <Trash2Icon />
                    {memberCount > 0 ? 'Hapus (masih dipakai)' : 'Hapus'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {role.system ? (
          <p className="text-sm text-muted-foreground">Semua izin di semua modul.</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada izin.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {modules.slice(0, SHOWN).map(({ module, level }) => (
              <li key={module.key}>
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <span className={cn('size-1.5 rounded-full', DOT[level])} aria-hidden />
                  {module.label}
                  <span className="sr-only">: {level === 'read' ? 'baca' : level === 'full' ? 'baca dan tulis' : 'tulis sebagian'}</span>
                </Badge>
              </li>
            ))}
            {modules.length > SHOWN && (
              <li>
                <Badge variant="secondary" className="font-normal">
                  +{modules.length - SHOWN} modul
                </Badge>
              </li>
            )}
          </ul>
        )}
      </CardContent>
      <CardFooter className="justify-between border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <UsersIcon className="size-3.5" />
          {memberCount} pengguna
        </span>
        <span className="tabular-nums">
          {role.permissions.length} izin · {writes} tulis
        </span>
      </CardFooter>
    </Card>
  )
}
