import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ACCESS_LEVEL_LABEL,
  accessLevel,
  ACTION_LABEL,
  ALL_PERMISSIONS,
  moduleActions,
  moduleOf,
  normalizePermissions,
  PERMISSION_GROUPS,
  PERMISSION_MODULES,
  permissionKey,
  WRITE_ACTIONS,
  type Permission,
  type PermissionAction,
  type PermissionModule,
} from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Fragment } from 'react'

type PermissionMatrixProps = {
  value: ReadonlyArray<Permission>
  onChange: (next: Array<Permission>) => void
  disabled?: boolean
}

function TriCheckbox({
  items,
  granted,
  onToggle,
  label,
  disabled,
}: {
  items: ReadonlyArray<Permission>
  granted: ReadonlySet<Permission>
  onToggle: (items: ReadonlyArray<Permission>, on: boolean) => void
  label: string
  disabled?: boolean
}) {
  if (items.length === 0) return <span className="text-muted-foreground/50">—</span>
  const count = items.filter((p) => granted.has(p)).length
  const all = count === items.length
  const some = count > 0 && !all
  return (
    <Checkbox
      aria-label={label}
      checked={all}
      indeterminate={some}
      disabled={disabled}
      onCheckedChange={() => onToggle(items, !all)}
      className="data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-primary-foreground data-indeterminate:[&_svg]:hidden"
    />
  )
}

const writesOf = (m: PermissionModule) =>
  moduleActions(m)
    .filter((a) => a !== 'read')
    .map((a) => permissionKey(m.key, a))

const actionOf = (m: PermissionModule, action: PermissionAction) =>
  moduleActions(m).includes(action) ? [permissionKey(m.key, action)] : []

const LEVEL_TONE = {
  none: 'text-muted-foreground',
  read: 'text-foreground',
  write: 'text-amber-600 dark:text-amber-400',
  full: 'text-primary',
} as const

export function PermissionMatrix({ value, onChange, disabled }: PermissionMatrixProps) {
  const granted = new Set(value)

  const toggle = (items: ReadonlyArray<Permission>, on: boolean) => {
    const next = new Set(granted)
    for (const p of items) {
      if (on) next.add(p)
      else next.delete(p)
      // removing read also removes every write on that module
      if (!on && p.endsWith('.read')) {
        const module = PERMISSION_MODULES.find((m) => m.key === moduleOf(p))
        if (module) writesOf(module).forEach((w) => next.delete(w))
      }
    }
    onChange(normalizePermissions([...next]))
  }

  const allReads = PERMISSION_MODULES.map((m) => permissionKey(m.key, 'read'))
  const allWrites = PERMISSION_MODULES.flatMap(writesOf)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{value.length}</span> dari {ALL_PERMISSIONS.length} izin dipilih
        </span>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange(normalizePermissions(allReads))}>
          Baca semua
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...ALL_PERMISSIONS])}>
          Akses penuh
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled || value.length === 0} onClick={() => onChange([])}>
          Kosongkan
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table className="min-w-[40rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead rowSpan={2} className="pl-4 align-bottom">
                Modul
              </TableHead>
              <TableHead rowSpan={2} className="w-20 border-l text-center align-bottom">
                <div className="flex flex-col items-center gap-1.5 py-1">
                  Baca
                  <TriCheckbox items={allReads} granted={granted} onToggle={toggle} label="Baca semua modul" disabled={disabled} />
                </div>
              </TableHead>
              <TableHead colSpan={4} className="h-8 border-l text-center">
                Tulis
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20 border-l bg-muted/40 text-center">
                <div className="flex flex-col items-center gap-1.5 py-1 text-xs">
                  Semua
                  <TriCheckbox items={allWrites} granted={granted} onToggle={toggle} label="Tulis semua modul" disabled={disabled} />
                </div>
              </TableHead>
              {WRITE_ACTIONS.map((action) => (
                <TableHead key={action} className="w-20 text-center">
                  <div className="flex flex-col items-center gap-1.5 py-1 text-xs font-normal text-muted-foreground">
                    {ACTION_LABEL[action]}
                    <TriCheckbox
                      items={PERMISSION_MODULES.flatMap((m) => actionOf(m, action))}
                      granted={granted}
                      onToggle={toggle}
                      label={`${ACTION_LABEL[action]} di semua modul`}
                      disabled={disabled}
                    />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_GROUPS.map((group) => {
              const groupItems = group.modules.flatMap((m) => moduleActions(m).map((a) => permissionKey(m.key, a)))
              return (
                <Fragment key={group.label}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={6} className="py-1.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <TriCheckbox
                          items={groupItems}
                          granted={granted}
                          onToggle={toggle}
                          label={`Semua izin ${group.label}`}
                          disabled={disabled}
                        />
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.modules.map((m) => {
                    const level = accessLevel(granted, m)
                    return (
                      <TableRow key={m.key}>
                        <TableCell className="pl-4 whitespace-normal">
                          <div className="flex flex-col gap-0.5 py-0.5">
                            <span className="flex flex-wrap items-center gap-x-2 font-medium">
                              {m.label}
                              <span className={cn('text-xs font-normal', LEVEL_TONE[level])}>{ACCESS_LEVEL_LABEL[level]}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{m.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-l text-center">
                          <div className="flex justify-center">
                            <TriCheckbox
                              items={actionOf(m, 'read')}
                              granted={granted}
                              onToggle={toggle}
                              label={`Baca ${m.label}`}
                              disabled={disabled}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="border-l bg-muted/20 text-center">
                          <div className="flex justify-center">
                            <TriCheckbox
                              items={writesOf(m)}
                              granted={granted}
                              onToggle={toggle}
                              label={`Tulis ${m.label}`}
                              disabled={disabled}
                            />
                          </div>
                        </TableCell>
                        {WRITE_ACTIONS.map((action) => (
                          <TableCell key={action} className="text-center">
                            <div className="flex justify-center">
                              <TriCheckbox
                                items={actionOf(m, action)}
                                granted={granted}
                                onToggle={toggle}
                                label={`${ACTION_LABEL[action]} ${m.label}`}
                                disabled={disabled}
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Izin tulis otomatis menyertakan izin baca pada modul yang sama. <Badge variant="outline">Baca</Badge> hanya melihat data,{' '}
        <Badge variant="outline">Tulis</Badge> mencakup tambah, ubah dan hapus.
      </p>
    </div>
  )
}
