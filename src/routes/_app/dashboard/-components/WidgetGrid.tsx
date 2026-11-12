import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WIDGET_SIZE_LABEL, widgetMeta, type DashboardLayout, type WidgetSize } from '@/lib/dashboard-widgets'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon, GripVerticalIcon, Maximize2Icon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { WIDGET_RENDERERS, type WidgetContext } from './widgets'

const SPAN: Record<WidgetSize, string> = {
  sm: 'col-span-1',
  md: 'sm:col-span-2',
  lg: 'sm:col-span-2 xl:col-span-3',
  full: 'sm:col-span-2 xl:col-span-4',
}

type WidgetGridProps = {
  layout: DashboardLayout
  context: WidgetContext
  editing: boolean
  onChange: (next: DashboardLayout) => void
}

function move<T>(list: ReadonlyArray<T>, from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

export function WidgetGrid({ layout, context, editing, onChange }: WidgetGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <div className={cn('grid grid-flow-row-dense gap-4 sm:grid-cols-2 xl:grid-cols-4', editing && 'gap-y-7 pt-3')}>
      {layout.map((item, index) => {
        const meta = widgetMeta(item.id)
        return (
          <section
            key={item.id}
            aria-label={meta.title}
            draggable={editing}
            onDragStart={(e) => {
              setDragIndex(index)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', item.id)
            }}
            onDragOver={(e) => {
              if (dragIndex === null) return
              e.preventDefault()
              if (overIndex !== index) setOverIndex(index)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null && dragIndex !== index) onChange(move(layout, dragIndex, index))
              setDragIndex(null)
              setOverIndex(null)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={cn(
              'relative min-w-0',
              SPAN[item.size],
              editing && 'cursor-grab rounded-xl outline-2 outline-offset-4 outline-primary/30 outline-dashed active:cursor-grabbing',
              editing && overIndex === index && dragIndex !== index && 'outline-primary outline-solid',
              dragIndex === index && 'opacity-40',
            )}
          >
            {editing && (
              <div className="absolute -top-4 right-2 left-2 z-10 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 rounded-md border bg-popover px-1.5 py-0.5 text-xs font-medium shadow-sm">
                  <GripVerticalIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{meta.title}</span>
                </span>
                <div className="flex shrink-0 items-center gap-0.5 rounded-md border bg-popover p-0.5 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Geser ${meta.title} ke depan`}
                    disabled={index === 0}
                    onClick={() => onChange(move(layout, index, index - 1))}
                  >
                    <ArrowLeftIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Geser ${meta.title} ke belakang`}
                    disabled={index === layout.length - 1}
                    onClick={() => onChange(move(layout, index, index + 1))}
                  >
                    <ArrowRightIcon />
                  </Button>
                  {meta.sizes.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Ukuran ${meta.title}`} />}>
                        <Maximize2Icon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Ukuran</DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={item.size}
                            onValueChange={(size: WidgetSize) => onChange(layout.map((x, i) => (i === index ? { ...x, size } : x)))}
                          >
                            {meta.sizes.map((size) => (
                              <DropdownMenuRadioItem key={size} value={size}>
                                {WIDGET_SIZE_LABEL[size]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Hapus ${meta.title} dari dasbor`}
                    onClick={() => onChange(layout.filter((_, i) => i !== index))}
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
            )}
            <div className={cn('h-full *:data-[slot=card]:h-full', editing && 'pointer-events-none select-none')}>
              {WIDGET_RENDERERS[item.id](context)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
