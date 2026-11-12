import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DASHBOARD_WIDGETS, type DashboardLayout, type DashboardWidget } from '@/lib/dashboard-widgets'
import { moduleLabel, moduleOf, type Permission } from '@/lib/permissions'
import { CheckIcon, LockIcon, PlusIcon } from 'lucide-react'

type WidgetPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  layout: DashboardLayout
  can: (permission: Permission) => boolean
  roleName: string
  onAdd: (widget: DashboardWidget) => void
}

export function WidgetPicker({ open, onOpenChange, layout, can, roleName, onAdd }: WidgetPickerProps) {
  const placed = new Set(layout.map((item) => item.id))
  const allowed = DASHBOARD_WIDGETS.filter((w) => can(w.permission))
  const locked = DASHBOARD_WIDGETS.filter((w) => !can(w.permission))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Tambah widget</SheetTitle>
          <SheetDescription>Widget yang tersedia mengikuti izin peran {roleName}.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          <ul className="flex flex-col gap-2">
            {allowed.map((w) => {
              const isPlaced = placed.has(w.id)
              return (
                <li key={w.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{w.title}</span>
                    <span className="text-xs text-muted-foreground">{w.description}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isPlaced ? 'ghost' : 'outline'}
                    disabled={isPlaced}
                    onClick={() => onAdd(w)}
                    aria-label={isPlaced ? `${w.title} sudah di dasbor` : `Tambah ${w.title}`}
                  >
                    {isPlaced ? <CheckIcon /> : <PlusIcon />}
                    {isPlaced ? 'Terpasang' : 'Tambah'}
                  </Button>
                </li>
              )
            })}
          </ul>
          {locked.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tidak tersedia untuk peran ini</span>
              <ul className="flex flex-col gap-2">
                {locked.map((w) => (
                  <li key={w.id} className="flex items-start gap-3 rounded-lg border border-dashed p-3 opacity-70">
                    <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">{w.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Butuh izin baca <Badge variant="outline">{moduleLabel(moduleOf(w.permission))}</Badge>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
